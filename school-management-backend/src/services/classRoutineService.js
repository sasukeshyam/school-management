const createCrudService = require('./crudService');
const { ClassRoutine } = require('../models/Academic');
module.exports = createCrudService(ClassRoutine, [{ path: 'class_setup_id' },{ path: 'subject_id' },{ path: 'teacher_id', populate: 'user_id' }]);
