const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/classRoutineController');
const { authenticate, permissionGuard } = require('../middlewares/authMiddleware');

router.use(authenticate);
router.get('/',    permissionGuard('class_routines.view'),   ctrl.getAll);
router.get('/:id', permissionGuard('class_routines.view'),   ctrl.getById);
router.post('/',   permissionGuard('class_routines.create'), ctrl.create);
router.put('/:id', permissionGuard('class_routines.edit'),   ctrl.update);
router.delete('/:id', permissionGuard('class_routines.delete'), ctrl.delete);

module.exports = router;
