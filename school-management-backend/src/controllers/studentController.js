const studentService = require('../services/studentService');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const filter = { school_id: req.schoolId };
    if (req.query.class_setup_id) filter.class_setup_id = req.query.class_setup_id;
    if (req.query.session_id)     filter.session_id     = req.query.session_id;
    if (req.query.status)         filter.status         = req.query.status;
    const result = await studentService.getAll(filter, req.query);
    sendPaginated(res, result.data, result.total, result.page, result.limit);
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const student = await studentService.getById(req.params.id, { school_id: req.schoolId });
    sendSuccess(res, student);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const student = await studentService.create(req.body, req.schoolId, req.user._id);
    sendSuccess(res, student, 'Student created successfully', 201);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const student = await studentService.update(req.params.id, req.body, { school_id: req.schoolId });
    sendSuccess(res, student, 'Student updated');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await studentService.softDelete(req.params.id, req.user._id, { school_id: req.schoolId });
    sendSuccess(res, {}, 'Student deleted');
  } catch (err) { next(err); }
};

const bulkImport = async (req, res, next) => {
  try {
    if (!req.body.students || !Array.isArray(req.body.students)) {
      return sendError(res, 'students array is required', 400);
    }
    const result = await studentService.bulkImport(
      req.body.students,
      req.schoolId,
      req.body.session_id,
      req.user._id
    );
    sendSuccess(res, result, 'Bulk import completed');
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, remove, bulkImport };
