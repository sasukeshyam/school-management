const createCrudController = require('./crudController');
const service = require('../services/markGradeService');
module.exports = createCrudController(service, 'MarkGrade');
