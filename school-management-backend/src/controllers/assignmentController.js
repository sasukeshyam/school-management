const assignmentService = require('../services/assignmentService');
const { sendSuccess, sendPaginated } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const filter = { school_id: req.schoolId };
    if (req.query.class_setup_id) filter.class_setup_id = req.query.class_setup_id;
    if (req.query.subject_id)     filter.subject_id     = req.query.subject_id;
    if (req.query.session_id)     filter.session_id     = req.query.session_id;
    const result = await assignmentService.getAll(filter, req.query);
    sendPaginated(res, result.data, result.total, result.page, result.limit);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const result = await assignmentService.create(req.body, req.schoolId, req.user._id, io);
    sendSuccess(res, result, `Assignment created and distributed to ${result.distributed_to} students`, 201);
  } catch (err) { next(err); }
};

const getMyAssignments = async (req, res, next) => {
  try {
    // student gets their own assignments via submission slots
    const { Student } = require('../models/Student');
    const student = await Student.findOne({ user_id: req.user._id, school_id: req.schoolId });
    if (!student) return sendSuccess(res, [], 'No assignments');
    const result = await assignmentService.getStudentAssignments(student._id, req.schoolId, req.query);
    sendPaginated(res, result.data, result.total, result.page, result.limit);
  } catch (err) { next(err); }
};

const submit = async (req, res, next) => {
  try {
    const { Student } = require('../models/Student');
    const student = await Student.findOne({ user_id: req.user._id, school_id: req.schoolId });
    if (!student) return sendSuccess(res, {}, 'Student profile not found', 404);
    const submission = await assignmentService.submitAssignment(
      req.params.id, student._id, req.body, req.schoolId
    );
    sendSuccess(res, submission, 'Assignment submitted');
  } catch (err) { next(err); }
};

const grade = async (req, res, next) => {
  try {
    const submission = await assignmentService.gradeSubmission(
      req.params.submissionId, req.body, req.user._id, req.schoolId
    );
    sendSuccess(res, submission, 'Submission graded');
  } catch (err) { next(err); }
};

module.exports = { getAll, create, getMyAssignments, submit, grade };
