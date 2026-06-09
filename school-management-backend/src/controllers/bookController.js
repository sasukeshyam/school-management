const createCrudController = require('./crudController');
const service = require('../services/bookService');
module.exports = createCrudController(service, 'Book');
