const createCrudService = require('./crudService');
const { Section } = require('../models/Academic');
module.exports = createCrudService(Section, []);
