const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

// Factory: returns a controller object for any service
const createCrudController = (service, resourceName = 'Resource') => ({

  getAll: async (req, res, next) => {
    try {
      const filter = { school_id: req.schoolId };
      // Allow child routes to inject extra filters via req.filter
      Object.assign(filter, req.filter || {});
      const result = await service.getAll(filter, req.query);
      sendPaginated(res, result.data, result.total, result.page, result.limit);
    } catch (err) { next(err); }
  },

  getById: async (req, res, next) => {
    try {
      const doc = await service.getById(req.params.id, { school_id: req.schoolId });
      sendSuccess(res, doc);
    } catch (err) { next(err); }
  },

  create: async (req, res, next) => {
    try {
      const data = { ...req.body, school_id: req.schoolId, created_by: req.user._id };
      const doc = await service.create(data);
      sendSuccess(res, doc, `${resourceName} created successfully`, 201);
    } catch (err) { next(err); }
  },

  update: async (req, res, next) => {
    try {
      const doc = await service.update(
        req.params.id,
        { ...req.body, updated_by: req.user._id },
        { school_id: req.schoolId }
      );
      sendSuccess(res, doc, `${resourceName} updated successfully`);
    } catch (err) { next(err); }
  },

  delete: async (req, res, next) => {
    try {
      await service.softDelete(req.params.id, req.user._id, { school_id: req.schoolId });
      sendSuccess(res, {}, `${resourceName} deleted successfully`);
    } catch (err) { next(err); }
  },
});

module.exports = createCrudController;
