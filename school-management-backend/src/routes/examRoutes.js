const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/examController');
const { authenticate, permissionGuard } = require('../middlewares/authMiddleware');

router.use(authenticate);

// Exam CRUD
router.get('/',                                 permissionGuard('exams.view'),              ctrl.getAll);
router.post('/',                                permissionGuard('exams.create'),            ctrl.create);
router.patch('/:id/status',                     permissionGuard('exams.edit'),              ctrl.updateStatus);

// Admit cards
router.post('/:id/admit-cards/generate',        permissionGuard('admitcard.generate'),      ctrl.generateAdmitCards);
router.patch('/:id/admit-cards/:cardId/approve',permissionGuard('admitcard.approve'),       ctrl.approveAdmitCard);

// Mark entry
router.post('/assigns/:assignId/marks',         permissionGuard('results.enter'),           ctrl.enterMarks);

// Marksheets
router.post('/:id/marksheets/generate',         permissionGuard('results.enter'),           ctrl.generateMarksheets);
router.patch('/:id/marksheets/approve',         permissionGuard('results.approve'),         ctrl.approveMarksheet);
router.patch('/:id/marksheets/publish',         permissionGuard('results.publish'),         ctrl.publishMarksheets);

module.exports = router;
