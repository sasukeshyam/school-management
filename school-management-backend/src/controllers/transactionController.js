const createCrudController = require('./crudController');
const service = require('../services/transactionService');
module.exports = createCrudController(service, 'Transaction');
