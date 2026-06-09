const createCrudService = require('./crudService');
const { Subject } = require('../models/Academic');
module.exports = createCrudService(Subject, []);
