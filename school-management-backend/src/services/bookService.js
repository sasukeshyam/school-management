const createCrudService = require('./crudService');
const { Book } = require('../models/Content');
module.exports = createCrudService(Book, []);
