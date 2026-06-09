const createCrudService = require('./crudService');
const { Transaction } = require('../models/Fee');
module.exports = createCrudService(Transaction, []);
