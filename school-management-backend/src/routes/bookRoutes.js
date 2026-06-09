const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/bookController');
const { authenticate, permissionGuard } = require('../middlewares/authMiddleware');

router.use(authenticate);
router.get('/',    permissionGuard('library.view'),   ctrl.getAll);
router.get('/:id', permissionGuard('library.view'),   ctrl.getById);
router.post('/',   permissionGuard('library.create'), ctrl.create);
router.put('/:id', permissionGuard('library.edit'),   ctrl.update);
router.delete('/:id', permissionGuard('library.delete'), ctrl.delete);

module.exports = router;
