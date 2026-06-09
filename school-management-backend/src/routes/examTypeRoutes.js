const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/examTypeController');
const { authenticate, permissionGuard } = require('../middlewares/authMiddleware');

router.use(authenticate);
router.get('/',    permissionGuard('exam_types.view'),   ctrl.getAll);
router.get('/:id', permissionGuard('exam_types.view'),   ctrl.getById);
router.post('/',   permissionGuard('exam_types.create'), ctrl.create);
router.put('/:id', permissionGuard('exam_types.edit'),   ctrl.update);
router.delete('/:id', permissionGuard('exam_types.delete'), ctrl.delete);

module.exports = router;
