const createCrudService = require('./crudService');
const { LessonPlan } = require('../models/Academic');
module.exports = createCrudService(LessonPlan, []);
