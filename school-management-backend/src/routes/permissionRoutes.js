const express = require('express');
const router = express.Router();
const { getAllPermissions } = require('../controllers/roleController');
const { authenticate, superAdminOnly } = require('../middlewares/authMiddleware');

router.use(authenticate, superAdminOnly);
router.get('/', getAllPermissions);

module.exports = router;
