const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/roleController');
const { authenticate, superAdminOnly, permissionGuard } = require('../middlewares/authMiddleware');

router.use(authenticate);

// Permission listing — any authenticated admin can view
router.get('/permissions',       permissionGuard('roles.view'), ctrl.getAllPermissions);

// Role CRUD — super admin only
router.get('/',                  permissionGuard('roles.view'),   ctrl.getAllRoles);
router.get('/:id',               permissionGuard('roles.view'),   ctrl.getRoleById);
router.post('/',                 superAdminOnly,                  ctrl.createRole);
router.put('/:id',               superAdminOnly,                  ctrl.updateRole);
router.delete('/:id',            superAdminOnly,                  ctrl.deleteRole);

// Assign permissions to a role
router.put('/:id/permissions',   superAdminOnly,                  ctrl.assignPermissions);

// Assign/revoke roles on users
router.post('/assign',           superAdminOnly,                  ctrl.assignRoleToUser);
router.post('/revoke',           superAdminOnly,                  ctrl.revokeRoleFromUser);

// Get roles for a specific user
router.get('/user/:userId',      permissionGuard('roles.view'),   ctrl.getUserRoles);

module.exports = router;
