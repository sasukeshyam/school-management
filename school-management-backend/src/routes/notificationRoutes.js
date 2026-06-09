const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notificationController');
const { authenticate, permissionGuard } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.post('/',         permissionGuard('notifications.create'), ctrl.send);
router.get('/my',        ctrl.getMyNotifications);
router.patch('/:id/read',ctrl.markRead);
router.patch('/read-all',ctrl.markAllRead);

module.exports = router;
