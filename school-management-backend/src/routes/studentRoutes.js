const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/studentController');
const { authenticate, permissionGuard } = require('../middlewares/authMiddleware');
const { upload } = require('../config/cloudinary');

router.use(authenticate);

router.get('/',             permissionGuard('students.view'),   ctrl.getAll);
router.get('/:id',          permissionGuard('students.view'),   ctrl.getById);
router.post('/',            permissionGuard('students.create'), ctrl.create);
router.put('/:id',          permissionGuard('students.edit'),   ctrl.update);
router.delete('/:id',       permissionGuard('students.delete'), ctrl.remove);
router.post('/bulk-import', permissionGuard('students.create'), ctrl.bulkImport);

module.exports = router;
