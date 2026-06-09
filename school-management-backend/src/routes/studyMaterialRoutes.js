const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/studyMaterialController');
const { authenticate, permissionGuard } = require('../middlewares/authMiddleware');

router.use(authenticate);
router.get('/',    permissionGuard('study_materials.view'),   ctrl.getAll);
router.get('/:id', permissionGuard('study_materials.view'),   ctrl.getById);
router.post('/',   permissionGuard('study_materials.create'), ctrl.create);
router.put('/:id', permissionGuard('study_materials.edit'),   ctrl.update);
router.delete('/:id', permissionGuard('study_materials.delete'), ctrl.delete);

module.exports = router;
