const createCrudService = require('./crudService');
const { FeeGroup } = require('../models/Fee');
module.exports = createCrudService(FeeGroup, []);
