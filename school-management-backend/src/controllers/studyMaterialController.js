const createCrudController = require('./crudController');
const service = require('../services/studyMaterialService');
module.exports = createCrudController(service, 'StudyMaterial');
