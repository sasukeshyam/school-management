const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/markGradeController');
const { authenticate, permissionGuard } = require('../middlewares/authMiddleware');

router.use(authenticate);
router.get('/',    permissionGuard('mark_grades.view'),   ctrl.getAll);
router.get('/:id', permissionGuard('mark_grades.view'),   ctrl.getById);
router.post('/',   permissionGuard('mark_grades.create'), ctrl.create);
router.put('/:id', permissionGuard('mark_grades.edit'),   ctrl.update);
router.delete('/:id', permissionGuard('mark_grades.delete'), ctrl.delete);

module.exports = router;
