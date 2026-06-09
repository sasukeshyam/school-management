const createCrudController = require('./crudController');
const service = require('../services/examRoutineService');
module.exports = createCrudController(service, 'ExamRoutine');
