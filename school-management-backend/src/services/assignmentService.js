const { Assignment, Submission } = require('../models/Content');
const { Student } = require('../models/Student');
const { Notification, NotificationRead } = require('../models/Content');
const { paginate } = require('../utils/pagination');

// When teacher creates assignment → auto-distribute to all students in class
const create = async (data, schoolId, createdBy, io) => {
  const assignment = await Assignment.create({
    ...data,
    school_id:  schoolId,
    created_by: createdBy,
  });

  // Find all active students in this class
  const students = await Student.find({
    class_setup_id: data.class_setup_id,
    school_id:      schoolId,
    status:         'active',
  }).populate('user_id', 'name');

  // Create pending submission slots for each student
  if (students.length > 0) {
    const submissionSlots = students.map((s) => ({
      school_id:     schoolId,
      assignment_id: assignment._id,
      student_id:    s._id,
      status:        'pending',
      created_by:    createdBy,
    }));
    await Submission.insertMany(submissionSlots, { ordered: false });
  }

  // Send real-time notification to all students in class
  if (io && students.length > 0) {
    const notifData = {
      type:    'new_assignment',
      title:   'New Assignment',
      message: `${assignment.title} has been assigned. Due: ${new Date(data.due_date).toLocaleDateString()}`,
      assignment_id: assignment._id,
    };
    students.forEach((s) => {
      if (s.user_id) io.to(s.user_id._id.toString()).emit('notification', notifData);
    });
  }

  return { assignment, distributed_to: students.length };
};

const getAll = async (filter, query) => {
  const { page, limit, skip, sort } = paginate(query);
  const [data, total] = await Promise.all([
    Assignment.find(filter)
      .populate('subject_id', 'name code')
      .populate({ path: 'teacher_id', populate: { path: 'user_id', select: 'name' } })
      .populate({ path: 'class_setup_id', populate: ['class_id','section_id'] })
      .sort(sort).skip(skip).limit(limit),
    Assignment.countDocuments(filter),
  ]);
  return { data, total, page, limit };
};

const getStudentAssignments = async (studentId, schoolId, query) => {
  const { page, limit, skip } = paginate(query);
  const filter = { student_id: studentId, school_id: schoolId };
  if (query.status) filter.status = query.status;

  const [submissions, total] = await Promise.all([
    Submission.find(filter)
      .populate({
        path: 'assignment_id',
        populate: ['subject_id', { path: 'teacher_id', populate: 'user_id' }],
      })
      .sort('-created_at').skip(skip).limit(limit),
    Submission.countDocuments(filter),
  ]);
  return { data: submissions, total, page, limit };
};

const submitAssignment = async (assignmentId, studentId, data, schoolId) => {
  const submission = await Submission.findOneAndUpdate(
    { assignment_id: assignmentId, student_id: studentId, school_id: schoolId },
    {
      files:        data.files || [],
      note:         data.note,
      submitted_at: new Date(),
      status:       'submitted',
    },
    { new: true }
  );
  if (!submission) throw Object.assign(new Error('Submission not found'), { statusCode: 404 });
  return submission;
};

const gradeSubmission = async (submissionId, data, gradedBy, schoolId) => {
  const submission = await Submission.findOneAndUpdate(
    { _id: submissionId, school_id: schoolId },
    {
      marks_obtained: data.marks_obtained,
      feedback:       data.feedback,
      graded_by:      gradedBy,
      graded_at:      new Date(),
      status:         'graded',
    },
    { new: true }
  );
  if (!submission) throw Object.assign(new Error('Submission not found'), { statusCode: 404 });
  return submission;
};

module.exports = { create, getAll, getStudentAssignments, submitAssignment, gradeSubmission };
