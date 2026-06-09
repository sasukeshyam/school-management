const createCrudService = require('./crudService');
const { ExamType } = require('../models/Exam');
module.exports = createCrudService(ExamType, []);
