const createCrudController = require('./crudController');
const service = require('../services/lessonPlanService');
module.exports = createCrudController(service, 'LessonPlan');
