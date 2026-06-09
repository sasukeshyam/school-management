const createCrudController = require('./crudController');
const service = require('../services/classRoutineService');
module.exports = createCrudController(service, 'ClassRoutine');
