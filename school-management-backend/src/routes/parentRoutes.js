const express = require('express');
const router = express.Router();
const createCrudController = require('../controllers/crudController');
const createCrudService = require('../services/crudService');
const { Parent } = require('../models/Student');
const { authenticate, permissionGuard } = require('../middlewares/authMiddleware');
const ctrl = createCrudController(createCrudService(Parent, [{ path: 'user_id', select: 'name email phone' }]), 'Parent');
router.use(authenticate);
router.get('/',    permissionGuard('parents.view'),   ctrl.getAll);
router.get('/:id', permissionGuard('parents.view'),   ctrl.getById);
router.post('/',   permissionGuard('parents.create'), ctrl.create);
router.put('/:id', permissionGuard('parents.edit'),   ctrl.update);
router.delete('/:id', permissionGuard('parents.delete'), ctrl.delete);
module.exports = router;



