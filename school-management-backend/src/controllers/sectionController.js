const createCrudController = require('./crudController');
const service = require('../services/sectionService');
module.exports = createCrudController(service, 'Section');
