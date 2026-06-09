const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/lessonPlanController');
const { authenticate, permissionGuard } = require('../middlewares/authMiddleware');

router.use(authenticate);
router.get('/',    permissionGuard('lesson_plans.view'),   ctrl.getAll);
router.get('/:id', permissionGuard('lesson_plans.view'),   ctrl.getById);
router.post('/',   permissionGuard('lesson_plans.create'), ctrl.create);
router.put('/:id', permissionGuard('lesson_plans.edit'),   ctrl.update);
router.delete('/:id', permissionGuard('lesson_plans.delete'), ctrl.delete);

module.exports = router;
