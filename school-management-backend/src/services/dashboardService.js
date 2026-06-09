const mongoose = require('mongoose');
const { Student } = require('../models/Student');
const { Teacher } = require('../models/Teacher');
const { Parent, StudentParent } = require('../models/Student');
const { FeeAssign, FeeCollect } = require('../models/Fee');
const { Attendance } = require('../models/Exam');
const { Event } = require('../models/Content');
const { Exam } = require('../models/Exam');
const { SubjectAssign } = require('../models/Academic');
const Session = require('../models/Session');

const getAdminDashboard = async (schoolId) => {
  const schoolObjId = new mongoose.Types.ObjectId(schoolId);
  const session = await Session.findOne({ school_id: schoolId, is_current: true });

  const [
    totalStudents, totalTeachers, totalParents,
    totalSessions, feeStats, monthlyCollection,
    upcomingEvents, recentExams,
  ] = await Promise.all([
    Student.countDocuments({ school_id: schoolId, status: 'active' }),
    Teacher.countDocuments({ school_id: schoolId, is_active: true }),
    Parent.countDocuments({ school_id: schoolId }),
    Session.countDocuments({ school_id: schoolId }),

    FeeAssign.aggregate([
      { $match: { school_id: schoolObjId } },
      { $group: {
        _id:            null,
        total_assigned: { $sum: '$amount' },
        paid_count:     { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
        unpaid_count:   { $sum: { $cond: [{ $eq: ['$status', 'unpaid'] }, 1, 0] } },
      }},
    ]),

    FeeCollect.aggregate([
      { $match: {
        school_id: schoolObjId,
        paid_date: { $gte: new Date(new Date().getFullYear(), 0, 1) },
      }},
      { $group: {
        _id:   { month: { $month: '$paid_date' } },
        total: { $sum: '$amount_paid' },
      }},
      { $sort: { '_id.month': 1 } },
    ]),

    Event.find({
      school_id:  schoolId,
      event_date: { $gte: new Date(), $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      is_active:  true,
    }).sort('event_date').limit(5),

    Exam.find({ school_id: schoolId })
      .populate('exam_type_id', 'name')
      .sort('-created_at').limit(5),
  ]);

  return {
    stats: {
      students: totalStudents,
      teachers: totalTeachers,
      parents:  totalParents,
      sessions: totalSessions,
    },
    fees: {
      summary:            feeStats[0] || {},
      monthly_collection: monthlyCollection,
    },
    upcoming_events: upcomingEvents,
    recent_exams:    recentExams,
    current_session: session,
  };
};

const getStudentDashboard = async (userId, schoolId) => {
  const schoolObjId = new mongoose.Types.ObjectId(schoolId);

  const student = await Student.findOne({ user_id: userId, school_id: schoolId })
    .populate({ path: 'class_setup_id', populate: ['class_id', 'section_id', 'shift_id'] })
    .populate('session_id');

  if (!student) return { message: 'Student profile not found' };

  const [attendanceSummary, pendingFees, upcomingEvents, upcomingExams] = await Promise.all([
    Attendance.aggregate([
      { $match: { student_id: student._id, school_id: schoolObjId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    FeeAssign.countDocuments({ student_id: student._id, status: { $in: ['unpaid', 'overdue'] } }),
    Event.find({ school_id: schoolId, event_date: { $gte: new Date() }, is_active: true })
      .sort('event_date').limit(5),
    Exam.find({ class_setup_id: student.class_setup_id, school_id: schoolId, status: 'published' })
      .populate('exam_type_id', 'name').sort('created_at').limit(5),
  ]);

  return { student, attendanceSummary, pendingFees, upcomingEvents, upcomingExams };
};

const getTeacherDashboard = async (userId, schoolId) => {
  const teacher = await Teacher.findOne({ user_id: userId, school_id: schoolId });
  if (!teacher) return { message: 'Teacher profile not found' };

  const [myClasses, mySubjects, upcomingEvents] = await Promise.all([
    SubjectAssign.find({ teacher_id: teacher._id, school_id: schoolId })
      .populate({ path: 'class_setup_id', populate: ['class_id', 'section_id'] })
      .populate('subject_id', 'name code'),
    SubjectAssign.distinct('subject_id', { teacher_id: teacher._id, school_id: schoolId }),
    Event.find({ school_id: schoolId, event_date: { $gte: new Date() }, is_active: true })
      .sort('event_date').limit(5),
  ]);

  return {
    teacher,
    my_classes:      myClasses,
    total_subjects:  mySubjects.length,
    upcoming_events: upcomingEvents,
  };
};

const getParentDashboard = async (userId, schoolId) => {
  const parent = await Parent.findOne({ user_id: userId, school_id: schoolId });
  if (!parent) return { message: 'Parent profile not found' };

  const links = await StudentParent.find({ parent_id: parent._id })
    .populate({ path: 'student_id', populate: ['user_id', 'class_setup_id'] });

  const studentIds = links.map((l) => l.student_id?._id).filter(Boolean);

  const [pendingFees, upcomingEvents] = await Promise.all([
    FeeAssign.countDocuments({ student_id: { $in: studentIds }, status: { $in: ['unpaid', 'overdue'] } }),
    Event.find({ school_id: schoolId, event_date: { $gte: new Date() }, is_active: true })
      .sort('event_date').limit(5),
  ]);

  return { parent, children: links, pending_fees: pendingFees, upcoming_events: upcomingEvents };
};

module.exports = { getAdminDashboard, getStudentDashboard, getTeacherDashboard, getParentDashboard };