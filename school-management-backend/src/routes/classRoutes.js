const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/classController');
const { authenticate, permissionGuard } = require('../middlewares/authMiddleware');

router.use(authenticate);
router.get('/',    permissionGuard('classes.view'),   ctrl.getAll);
router.get('/:id', permissionGuard('classes.view'),   ctrl.getById);
router.post('/',   permissionGuard('classes.create'), ctrl.create);
router.put('/:id', permissionGuard('classes.edit'),   ctrl.update);
router.delete('/:id', permissionGuard('classes.delete'), ctrl.delete);

module.exports = router;
