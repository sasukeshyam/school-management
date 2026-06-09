const quizService = require('../services/quizService');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { Student } = require('../models/Student');

// ─── Teacher / Admin ──────────────────────────────────────────────────────────
const getAll = async (req, res, next) => {
  try {
    const filter = { school_id: req.schoolId };
    if (req.query.status)     filter.status     = req.query.status;
    if (req.query.subject_id) filter.subject_id = req.query.subject_id;
    const result = await quizService.getQuizzes(filter, req.query);
    sendPaginated(res, result.data, result.total, result.page, result.limit);
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const { Quiz } = require('../models/Quiz');
    const quiz = await Quiz.findOne({ _id: req.params.id, school_id: req.schoolId })
      .populate('subject_id', 'name code')
      .populate({ path: 'teacher_id', populate: { path: 'user_id', select: 'name' } })
      .populate({ path: 'class_setup_ids', populate: ['class_id', 'section_id'] });
    if (!quiz) return sendError(res, 'Quiz not found', 404);
    sendSuccess(res, quiz);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const quiz = await quizService.createQuiz(req.body, req.schoolId, req.user._id);
    sendSuccess(res, quiz, 'Quiz created', 201);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { Quiz } = require('../models/Quiz');
    const quiz = await Quiz.findOneAndUpdate(
      { _id: req.params.id, school_id: req.schoolId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!quiz) return sendError(res, 'Quiz not found', 404);
    sendSuccess(res, quiz, 'Quiz updated');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const { Quiz, QuizQuestion, QuizAttempt } = require('../models/Quiz');
    await Quiz.findOneAndUpdate({ _id: req.params.id, school_id: req.schoolId }, { is_deleted: true });
    await QuizQuestion.deleteMany({ quiz_id: req.params.id });
    sendSuccess(res, {}, 'Quiz deleted');
  } catch (err) { next(err); }
};

const saveQuestions = async (req, res, next) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions) || questions.length === 0)
      return sendError(res, 'questions array is required', 400);
    const result = await quizService.addQuestions(req.params.id, questions, req.schoolId, req.user._id);
    sendSuccess(res, result, `${result.length} questions saved`);
  } catch (err) { next(err); }
};

const getQuestions = async (req, res, next) => {
  try {
    const questions = await quizService.getQuestions(req.params.id, req.schoolId);
    sendSuccess(res, questions);
  } catch (err) { next(err); }
};

const publish = async (req, res, next) => {
  try {
    const quiz = await quizService.publishQuiz(req.params.id, req.schoolId);
    sendSuccess(res, quiz, 'Quiz published! Students can now attempt it.');
  } catch (err) { next(err); }
};

const end = async (req, res, next) => {
  try {
    const { Quiz } = require('../models/Quiz');
    const quiz = await Quiz.findOneAndUpdate(
      { _id: req.params.id, school_id: req.schoolId },
      { status: 'ended' },
      { new: true }
    );
    sendSuccess(res, quiz, 'Quiz ended');
  } catch (err) { next(err); }
};

const getResults = async (req, res, next) => {
  try {
    const result = await quizService.getResults(req.params.id, req.schoolId, req.query);
    sendSuccess(res, result);
  } catch (err) { next(err); }
};

// ─── Student ──────────────────────────────────────────────────────────────────
const studentGetQuizzes = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user_id: req.user._id, school_id: req.schoolId });
    if (!student) return sendError(res, 'Student profile not found', 404);
    const quizzes = await quizService.getStudentQuizzes(student, req.schoolId);
    sendSuccess(res, quizzes);
  } catch (err) { next(err); }
};

const startQuiz = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user_id: req.user._id, school_id: req.schoolId });
    if (!student) return sendError(res, 'Student profile not found', 404);
    const result = await quizService.startQuiz(req.params.id, student, req.schoolId);
    sendSuccess(res, result, 'Quiz started. Good luck!');
  } catch (err) { next(err); }
};

const submitQuiz = async (req, res, next) => {
  try {
    const { answers } = req.body;
    if (!Array.isArray(answers)) return sendError(res, 'answers array is required', 400);
    const result = await quizService.submitQuiz(req.params.attemptId, answers, req.user._id, req.schoolId);
    sendSuccess(res, result, 'Quiz submitted successfully!');
  } catch (err) { next(err); }
};

const getMyAttempt = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user_id: req.user._id, school_id: req.schoolId });
    if (!student) return sendError(res, 'Student not found', 404);
    const { QuizAttempt } = require('../models/Quiz');
    const attempt = await QuizAttempt.findOne({ quiz_id: req.params.id, student_id: student._id });
    sendSuccess(res, attempt);
  } catch (err) { next(err); }
};

module.exports = {
  getAll, getById, create, update, remove,
  saveQuestions, getQuestions, publish, end, getResults,
  studentGetQuizzes, startQuiz, submitQuiz, getMyAttempt,
};