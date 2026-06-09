const express = require('express');
const router = express.Router();
const createCrudController = require('../controllers/crudController');
const createCrudService = require('../services/crudService');
const { OnlineAdmission } = require('../models/Content');
const { authenticate, permissionGuard } = require('../middlewares/authMiddleware');
const ctrl = createCrudController(createCrudService(OnlineAdmission), 'Admission');
// Public route for applying
router.post('/apply', ctrl.create);
router.use(authenticate);
router.get('/',    permissionGuard('admissions.view'),   ctrl.getAll);
router.get('/:id', permissionGuard('admissions.view'),   ctrl.getById);
router.put('/:id', permissionGuard('admissions.review'), ctrl.update);
router.delete('/:id', permissionGuard('admissions.delete'), ctrl.delete);
module.exports = router;
