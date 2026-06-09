const examService = require('../services/examService');
const { sendSuccess, sendPaginated } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const filter = { school_id: req.schoolId };
    if (req.query.session_id)     filter.session_id     = req.query.session_id;
    if (req.query.class_setup_id) filter.class_setup_id = req.query.class_setup_id;
    if (req.query.status)         filter.status         = req.query.status;
    const result = await examService.getExams(filter, req.query);
    sendPaginated(res, result.data, result.total, result.page, result.limit);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const exam = await examService.createExam({ ...req.body, school_id: req.schoolId, created_by: req.user._id });
    sendSuccess(res, exam, 'Exam created', 201);
  } catch (err) { next(err); }
};

const updateStatus = async (req, res, next) => {
  try {
    const exam = await examService.updateExamStatus(req.params.id, req.body.status, req.schoolId);
    sendSuccess(res, exam, 'Exam status updated');
  } catch (err) { next(err); }
};

const generateAdmitCards = async (req, res, next) => {
  try {
    const result = await examService.generateAdmitCards(req.params.id, req.schoolId, req.user._id);
    sendSuccess(res, result, 'Admit cards generated');
  } catch (err) { next(err); }
};

const approveAdmitCard = async (req, res, next) => {
  try {
    const card = await examService.approveAdmitCard(req.params.cardId, req.schoolId, req.user._id);
    sendSuccess(res, card, 'Admit card approved');
  } catch (err) { next(err); }
};

const enterMarks = async (req, res, next) => {
  try {
    const result = await examService.enterMarks(
      req.params.assignId, req.body.marks, req.schoolId, req.user._id
    );
    sendSuccess(res, result, 'Marks entered successfully');
  } catch (err) { next(err); }
};

const generateMarksheets = async (req, res, next) => {
  try {
    const result = await examService.generateMarksheets(req.params.id, req.schoolId, req.user._id);
    sendSuccess(res, result, 'Marksheets generated');
  } catch (err) { next(err); }
};

const approveMarksheet = async (req, res, next) => {
  try {
    const result = await examService.approveMarksheet(req.params.id, req.schoolId, req.user._id);
    sendSuccess(res, result, 'Sent for approval');
  } catch (err) { next(err); }
};

const publishMarksheets = async (req, res, next) => {
  try {
    const result = await examService.publishMarksheets(req.params.id, req.schoolId, req.user._id);
    sendSuccess(res, result, 'Marksheets published');
  } catch (err) { next(err); }
};

module.exports = {
  getAll, create, updateStatus,
  generateAdmitCards, approveAdmitCard,
  enterMarks,
  generateMarksheets, approveMarksheet, publishMarksheets,
};
