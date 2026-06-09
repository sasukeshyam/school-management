const createCrudController = require('./crudController');
const service = require('../services/feeTypeService');
module.exports = createCrudController(service, 'FeeType');
