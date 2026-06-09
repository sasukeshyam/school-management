const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/feeCollectController');
const createCrudController = require('../controllers/crudController');
const createCrudService = require('../services/crudService');
const { FeeAssign, FeeMaster } = require('../models/Fee');
const { authenticate, permissionGuard } = require('../middlewares/authMiddleware');

router.use(authenticate);

// Bulk assign
router.post('/bulk-assign',                 permissionGuard('fees.collect'),  ctrl.bulkAssign);
// Collect payment for a specific fee assignment
router.post('/assign/:assignId/collect',    permissionGuard('fees.collect'),  ctrl.collectFee);
// Get all fees for a student
router.get('/student/:studentId',           permissionGuard('fees.view'),     ctrl.getStudentFees);
// Fee report
router.get('/report',                       permissionGuard('fees.view'),     ctrl.getFeeReport);

module.exports = router;
