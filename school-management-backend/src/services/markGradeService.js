const createCrudService = require('./crudService');
const { MarkGrade } = require('../models/Exam');
module.exports = createCrudService(MarkGrade, []);
