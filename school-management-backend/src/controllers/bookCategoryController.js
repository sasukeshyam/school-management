const createCrudController = require('./crudController');
const service = require('../services/bookCategoryService');
module.exports = createCrudController(service, 'BookCategory');
