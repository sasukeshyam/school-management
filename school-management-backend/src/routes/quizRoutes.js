const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/quizController');
const { authenticate, permissionGuard } = require('../middlewares/authMiddleware');

router.use(authenticate);

// ─── Student routes ───────────────────────────────────────────────────────────
router.get('/student/available',           ctrl.studentGetQuizzes);
router.post('/student/:id/start',          ctrl.startQuiz);
router.post('/student/attempt/:attemptId/submit', ctrl.submitQuiz);
router.get('/student/:id/my-attempt',      ctrl.getMyAttempt);

// ─── Teacher / Admin routes ───────────────────────────────────────────────────
router.get('/',                            permissionGuard('exams.view'),   ctrl.getAll);
router.post('/',                           permissionGuard('exams.create'), ctrl.create);
router.get('/:id',                         permissionGuard('exams.view'),   ctrl.getById);
router.put('/:id',                         permissionGuard('exams.edit'),   ctrl.update);
router.delete('/:id',                      permissionGuard('exams.delete'), ctrl.remove);
router.get('/:id/questions',               permissionGuard('exams.view'),   ctrl.getQuestions);
router.post('/:id/questions',              permissionGuard('exams.create'), ctrl.saveQuestions);
router.patch('/:id/publish',               permissionGuard('exams.edit'),   ctrl.publish);
router.patch('/:id/end',                   permissionGuard('exams.edit'),   ctrl.end);
router.get('/:id/results',                 permissionGuard('results.view'), ctrl.getResults);

module.exports = router;