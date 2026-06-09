const createCrudService = require('./crudService');
const { Class } = require('../models/Academic');
module.exports = createCrudService(Class, []);
