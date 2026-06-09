const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/sectionController');
const { authenticate, permissionGuard } = require('../middlewares/authMiddleware');

router.use(authenticate);
router.get('/',    permissionGuard('sections.view'),   ctrl.getAll);
router.get('/:id', permissionGuard('sections.view'),   ctrl.getById);
router.post('/',   permissionGuard('sections.create'), ctrl.create);
router.put('/:id', permissionGuard('sections.edit'),   ctrl.update);
router.delete('/:id', permissionGuard('sections.delete'), ctrl.delete);

module.exports = router;
