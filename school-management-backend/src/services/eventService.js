const createCrudService = require('./crudService');
const { Event } = require('../models/Content');
module.exports = createCrudService(Event, []);
