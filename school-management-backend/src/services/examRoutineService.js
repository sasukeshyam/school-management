const createCrudService = require('./crudService');
const { ExamRoutine } = require('../models/Exam');
module.exports = createCrudService(ExamRoutine, []);
