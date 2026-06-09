const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/examRoutineController');
const { authenticate, permissionGuard } = require('../middlewares/authMiddleware');

router.use(authenticate);
router.get('/',    permissionGuard('exam_routines.view'),   ctrl.getAll);
router.get('/:id', permissionGuard('exam_routines.view'),   ctrl.getById);
router.post('/',   permissionGuard('exam_routines.create'), ctrl.create);
router.put('/:id', permissionGuard('exam_routines.edit'),   ctrl.update);
router.delete('/:id', permissionGuard('exam_routines.delete'), ctrl.delete);

module.exports = router;
