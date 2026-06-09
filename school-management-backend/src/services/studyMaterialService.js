const createCrudService = require('./crudService');
const { StudyMaterial } = require('../models/Academic');
module.exports = createCrudService(StudyMaterial, []);
