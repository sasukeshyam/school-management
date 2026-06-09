const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/attendanceController');
const { authenticate, permissionGuard } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.post('/mark',                                    permissionGuard('attendance.mark'),   ctrl.markBulk);
router.get('/class',                                    permissionGuard('attendance.view'),   ctrl.getByClass);
router.get('/student/:studentId/report',                permissionGuard('attendance.view'),   ctrl.getStudentReport);
router.get('/class/:classSetupId/report',               permissionGuard('attendance.view'),   ctrl.getClassReport);

module.exports = router;
