const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/shiftController');
const { authenticate, permissionGuard } = require('../middlewares/authMiddleware');

router.use(authenticate);
router.get('/',    permissionGuard('shifts.view'),   ctrl.getAll);
router.get('/:id', permissionGuard('shifts.view'),   ctrl.getById);
router.post('/',   permissionGuard('shifts.create'), ctrl.create);
router.put('/:id', permissionGuard('shifts.edit'),   ctrl.update);
router.delete('/:id', permissionGuard('shifts.delete'), ctrl.delete);

module.exports = router;
