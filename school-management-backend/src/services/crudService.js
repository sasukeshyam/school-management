const { paginate } = require('../utils/pagination');

// Factory: returns a service object for any Mongoose model
const createCrudService = (Model, populateOptions = []) => ({

  getAll: async (filter = {}, query = {}) => {
    const { page, limit, skip, sort } = paginate(query);
    const [data, total] = await Promise.all([
      Model.find(filter).populate(populateOptions).sort(sort).skip(skip).limit(limit),
      Model.countDocuments(filter),
    ]);
    return { data, total, page, limit };
  },

  getById: async (id, filter = {}) => {
    const doc = await Model.findOne({ _id: id, ...filter }).populate(populateOptions);
    if (!doc) throw Object.assign(new Error(`${Model.modelName} not found`), { statusCode: 404 });
    return doc;
  },

  create: async (data) => {
    const doc = await Model.create(data);
    return doc;
  },

  update: async (id, data, filter = {}) => {
    const doc = await Model.findOneAndUpdate(
      { _id: id, ...filter },
      data,
      { new: true, runValidators: true }
    ).populate(populateOptions);
    if (!doc) throw Object.assign(new Error(`${Model.modelName} not found`), { statusCode: 404 });
    return doc;
  },

  softDelete: async (id, userId, filter = {}) => {
    const doc = await Model.findOne({ _id: id, ...filter });
    if (!doc) throw Object.assign(new Error(`${Model.modelName} not found`), { statusCode: 404 });
    await doc.softDelete(userId);
    return { message: `${Model.modelName} deleted successfully` };
  },
});

module.exports = createCrudService;
