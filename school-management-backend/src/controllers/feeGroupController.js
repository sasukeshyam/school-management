const createCrudController = require('./crudController');
const service = require('../services/feeGroupService');
module.exports = createCrudController(service, 'FeeGroup');
