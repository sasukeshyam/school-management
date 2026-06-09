const createCrudController = require('./crudController');
const service = require('../services/eventService');
module.exports = createCrudController(service, 'Event');
