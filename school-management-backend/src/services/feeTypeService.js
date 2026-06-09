const createCrudService = require('./crudService');
const { FeeType } = require('../models/Fee');
module.exports = createCrudService(FeeType, []);
