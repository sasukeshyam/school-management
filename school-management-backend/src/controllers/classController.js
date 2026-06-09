const createCrudController = require('./crudController');
const service = require('../services/classService');
module.exports = createCrudController(service, 'Class');
