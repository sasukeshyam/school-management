const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/assignmentController');
const { authenticate, permissionGuard } = require('../middlewares/authMiddleware');
const { upload } = require('../config/cloudinary');

router.use(authenticate);

router.get('/',                                  permissionGuard('assignments.view'),   ctrl.getAll);
router.post('/',                                 permissionGuard('assignments.create'), ctrl.create);
router.get('/my',                                permissionGuard('assignments.view'),   ctrl.getMyAssignments);
router.post('/:id/submit',                       permissionGuard('assignments.view'),   ctrl.submit);
router.patch('/:id/submissions/:submissionId/grade', permissionGuard('assignments.grade'), ctrl.grade);

module.exports = router;
