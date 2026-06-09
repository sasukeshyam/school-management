const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/subjectController');
const { authenticate, permissionGuard } = require('../middlewares/authMiddleware');

router.use(authenticate);
router.get('/',    permissionGuard('subjects.view'),   ctrl.getAll);
router.get('/:id', permissionGuard('subjects.view'),   ctrl.getById);
router.post('/',   permissionGuard('subjects.create'), ctrl.create);
router.put('/:id', permissionGuard('subjects.edit'),   ctrl.update);
router.delete('/:id', permissionGuard('subjects.delete'), ctrl.delete);

module.exports = router;
