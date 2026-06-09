const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/eventController');
const { authenticate, permissionGuard } = require('../middlewares/authMiddleware');

router.use(authenticate);
router.get('/',    permissionGuard('events.view'),   ctrl.getAll);
router.get('/:id', permissionGuard('events.view'),   ctrl.getById);
router.post('/',   permissionGuard('events.create'), ctrl.create);
router.put('/:id', permissionGuard('events.edit'),   ctrl.update);
router.delete('/:id', permissionGuard('events.delete'), ctrl.delete);

module.exports = router;
