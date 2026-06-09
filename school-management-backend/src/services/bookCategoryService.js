const createCrudService = require('./crudService');
const { BookCategory } = require('../models/Content');
module.exports = createCrudService(BookCategory, []);
