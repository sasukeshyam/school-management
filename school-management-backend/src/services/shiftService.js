const createCrudService = require('./crudService');
const { Shift } = require('../models/Academic');
module.exports = createCrudService(Shift, []);
