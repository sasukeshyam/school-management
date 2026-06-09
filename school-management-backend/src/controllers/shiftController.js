const createCrudController = require('./crudController');
const service = require('../services/shiftService');
module.exports = createCrudController(service, 'Shift');
