const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dashboardController');
const { authenticate, permissionGuard } = require('../middlewares/authMiddleware');
const { loadPermissions } = require('../middlewares/authMiddleware');

router.use(authenticate);

// Smart dashboard — detects role and returns appropriate data
router.get('/', async (req, res, next) => {
  req.permissions = await loadPermissions(req.user._id, req.schoolId);
  next();
}, ctrl.getDashboard);

// Explicit dashboards
router.get('/admin',   permissionGuard('admin.dashboard'),   ctrl.getAdminDashboard);
router.get('/student', permissionGuard('student.dashboard'), ctrl.getStudentDashboard);
router.get('/teacher', permissionGuard('teacher.dashboard'), ctrl.getTeacherDashboard);
router.get('/parent',  permissionGuard('parent.dashboard'),  ctrl.getParentDashboard);

module.exports = router;
