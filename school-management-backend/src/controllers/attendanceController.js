const attendanceService = require('../services/attendanceService');
const { sendSuccess, sendPaginated } = require('../utils/response');

const markBulk = async (req, res, next) => {
  try {
    const { records, class_setup_id, date, subject_id } = req.body;
    const result = await attendanceService.markBulk(
      records, class_setup_id, date, req.schoolId, req.user._id
    );
    sendSuccess(res, result, 'Attendance marked successfully');
  } catch (err) { next(err); }
};

const getByClass = async (req, res, next) => {
  try {
    const { class_setup_id, date, subject_id } = req.query;
    const data = await attendanceService.getByClass(class_setup_id, date, req.schoolId, subject_id);
    sendSuccess(res, data);
  } catch (err) { next(err); }
};

const getStudentReport = async (req, res, next) => {
  try {
    const result = await attendanceService.getStudentReport(
      req.params.studentId, req.schoolId, req.query
    );
    sendSuccess(res, result);
  } catch (err) { next(err); }
};

const getClassReport = async (req, res, next) => {
  try {
    const result = await attendanceService.getClassReport(
      req.params.classSetupId, req.schoolId, req.query
    );
    sendSuccess(res, result);
  } catch (err) { next(err); }
};

module.exports = { markBulk, getByClass, getStudentReport, getClassReport };
