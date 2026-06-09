const express = require('express');
const router = express.Router();
const createCrudController = require('../controllers/crudController');
const createCrudService = require('../services/crudService');
const { ClassSetup } = require('../models/Academic');
const { authenticate, permissionGuard } = require('../middlewares/authMiddleware');
const populate = [
    { path: 'class_id' },
    { path: 'section_id' },
    { path: 'shift_id' },
    { path: 'class_teacher_id', populate: { path: 'user_id', select: 'name' } },
];
const ctrl = createCrudController(createCrudService(ClassSetup, populate), 'ClassSetup');
router.use(authenticate);
router.get('/',    permissionGuard('classes.view'),   ctrl.getAll);
router.get('/:id', permissionGuard('classes.view'),   ctrl.getById);
router.post('/',   permissionGuard('classes.create'), ctrl.create);
router.put('/:id', permissionGuard('classes.edit'),   ctrl.update);
router.delete('/:id', permissionGuard('classes.delete'), ctrl.delete);
module.exports = router;
