const createCrudController = require('./crudController');
const service = require('../services/examTypeService');
module.exports = createCrudController(service, 'ExamType');
