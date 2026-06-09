const createCrudController = require('./crudController');
const service = require('../services/subjectService');
module.exports = createCrudController(service, 'Subject');
