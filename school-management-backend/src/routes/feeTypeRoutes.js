const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/feeTypeController');
const { authenticate, permissionGuard } = require('../middlewares/authMiddleware');

router.use(authenticate);
router.get('/',    permissionGuard('fees.view'),   ctrl.getAll);
router.get('/:id', permissionGuard('fees.view'),   ctrl.getById);
router.post('/',   permissionGuard('fees.create'), ctrl.create);
router.put('/:id', permissionGuard('fees.edit'),   ctrl.update);
router.delete('/:id', permissionGuard('fees.delete'), ctrl.delete);

module.exports = router;
