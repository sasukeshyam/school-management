const feeService = require('../services/feeService');
const { sendSuccess, sendPaginated } = require('../utils/response');

const bulkAssign = async (req, res, next) => {
  try {
    const result = await feeService.bulkAssign(
      req.body.fee_master_id, req.schoolId, req.user._id, req.body.student_ids
    );
    sendSuccess(res, result, `Fee assigned to ${result.assigned} students`);
  } catch (err) { next(err); }
};

const collectFee = async (req, res, next) => {
  try {
    const collection = await feeService.collectFee(
      req.params.assignId, req.body, req.schoolId, req.user._id
    );
    sendSuccess(res, collection, 'Payment recorded successfully', 201);
  } catch (err) { next(err); }
};

const getStudentFees = async (req, res, next) => {
  try {
    const result = await feeService.getStudentFees(req.params.studentId, req.schoolId, req.query);
    sendPaginated(res, result.data, result.total, result.page, result.limit);
  } catch (err) { next(err); }
};

const getFeeReport = async (req, res, next) => {
  try {
    const report = await feeService.getFeeReport(req.schoolId, req.query);
    sendSuccess(res, report);
  } catch (err) { next(err); }
};

module.exports = { bulkAssign, collectFee, getStudentFees, getFeeReport };
