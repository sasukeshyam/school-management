const { Quiz, QuizQuestion, QuizAttempt } = require('../models/Quiz');
const { Student } = require('../models/Student');
const { paginate } = require('../utils/pagination');

// ─── Teacher: Create quiz ─────────────────────────────────────────────────────
const createQuiz = async (data, schoolId, createdBy) => {
  const quiz = await Quiz.create({ ...data, school_id: schoolId, created_by: createdBy });
  return quiz;
};

// ─── Teacher: Get all quizzes ─────────────────────────────────────────────────
const getQuizzes = async (filter, query) => {
  const { page, limit, skip, sort } = paginate(query);
  const [data, total] = await Promise.all([
    Quiz.find(filter)
      .populate('subject_id', 'name code')
      .populate({ path: 'teacher_id', populate: { path: 'user_id', select: 'name' } })
      .populate({ path: 'class_setup_ids', populate: ['class_id', 'section_id'] })
      .sort(sort).skip(skip).limit(limit),
    Quiz.countDocuments(filter),
  ]);
  return { data, total, page, limit };
};

// ─── Teacher: Add questions to quiz ──────────────────────────────────────────
const addQuestions = async (quizId, questions, schoolId, createdBy) => {
  // Delete existing questions and re-insert (full replace)
  await QuizQuestion.deleteMany({ quiz_id: quizId, school_id: schoolId });

  const docs = questions.map((q, i) => ({
    ...q,
    quiz_id:    quizId,
    school_id:  schoolId,
    order:      i,
    created_by: createdBy,
  }));

  const created = await QuizQuestion.insertMany(docs);

  // Update quiz total marks and question count
  const totalMarks = questions.reduce((s, q) => s + (q.marks || 1), 0);
  await Quiz.findByIdAndUpdate(quizId, {
    total_marks:     totalMarks,
    total_questions: questions.length,
  });

  return created;
};

// ─── Teacher: Get questions ───────────────────────────────────────────────────
const getQuestions = async (quizId, schoolId) => {
  return QuizQuestion.find({ quiz_id: quizId, school_id: schoolId }).sort('order');
};

// ─── Teacher: Publish quiz ────────────────────────────────────────────────────
const publishQuiz = async (quizId, schoolId) => {
  const questions = await QuizQuestion.countDocuments({ quiz_id: quizId, school_id: schoolId });
  if (questions === 0) throw Object.assign(new Error('Cannot publish quiz with no questions'), { statusCode: 400 });

  return Quiz.findOneAndUpdate(
    { _id: quizId, school_id: schoolId },
    { status: 'published' },
    { new: true }
  );
};

// ─── Teacher: Get results ─────────────────────────────────────────────────────
const getResults = async (quizId, schoolId, query) => {
  const { page, limit, skip } = paginate(query);

  const quiz = await Quiz.findOne({ _id: quizId, school_id: schoolId });
  if (!quiz) throw Object.assign(new Error('Quiz not found'), { statusCode: 404 });

  const [attempts, total] = await Promise.all([
    QuizAttempt.find({ quiz_id: quizId, school_id: schoolId, status: { $ne: 'in_progress' } })
      .populate({ path: 'student_id', populate: { path: 'user_id', select: 'name' } })
      .sort('-score').skip(skip).limit(limit),
    QuizAttempt.countDocuments({ quiz_id: quizId, school_id: schoolId, status: { $ne: 'in_progress' } }),
  ]);

  // Question-wise analysis
  const analysis = await QuizAttempt.aggregate([
    { $match: { quiz_id: require('mongoose').Types.ObjectId ? new (require('mongoose').Types.ObjectId)(quizId) : quiz._id, school_id: require('mongoose').Types.ObjectId ? new (require('mongoose').Types.ObjectId)(schoolId) : quiz.school_id } },
    { $unwind: '$answers' },
    { $group: {
      _id:           '$answers.question_id',
      total_attempts:{ $sum: 1 },
      correct:       { $sum: { $cond: ['$answers.is_correct', 1, 0] } },
    }},
  ]);

  // Total students in assigned classes
  const totalStudents = await Student.countDocuments({
    class_setup_id: { $in: quiz.class_setup_ids },
    school_id: schoolId,
    status: 'active',
  });

  return { quiz, attempts, total, page, limit, analysis, totalStudents };
};

// ─── Student: Get available quizzes ──────────────────────────────────────────
const getStudentQuizzes = async (student, schoolId) => {
  const now = new Date();
  const quizzes = await Quiz.find({
    school_id:       schoolId,
    class_setup_ids: student.class_setup_id,
    status:          'published',
    $or: [
      { end_time: { $gte: now } },
      { end_time: null },
      { end_time: { $exists: false } },
    ],
  })
    .populate('subject_id', 'name code')
    .populate({ path: 'teacher_id', populate: { path: 'user_id', select: 'name' } })
    .sort('-created_at');

  // Check attempt status for each quiz
  const quizzesWithStatus = await Promise.all(quizzes.map(async (quiz) => {
    const attempt = await QuizAttempt.findOne({ quiz_id: quiz._id, student_id: student._id });
    return {
      ...quiz.toObject(),
      attempt_status: attempt?.status || null,
      attempt_id:     attempt?._id   || null,
      score:          attempt?.score || null,
      percentage:     attempt?.percentage || null,
    };
  }));

  return quizzesWithStatus;
};

// ─── Student: Start quiz ──────────────────────────────────────────────────────
const startQuiz = async (quizId, student, schoolId) => {
  const quiz = await Quiz.findOne({ _id: quizId, school_id: schoolId, status: 'published' });
  if (!quiz) throw Object.assign(new Error('Quiz not found or not published'), { statusCode: 404 });

  // Check if already attempted
  const existing = await QuizAttempt.findOne({ quiz_id: quizId, student_id: student._id });
  if (existing && existing.status === 'submitted' && !quiz.allow_reattempt) {
    throw Object.assign(new Error('You have already submitted this quiz'), { statusCode: 400 });
  }
  if (existing && existing.status === 'in_progress') {
    // Resume existing attempt — return questions
    const questions = await getQuestionsForAttempt(quiz);
    return { attempt: existing, questions, quiz };
  }

  // Check time window
  const now = new Date();
  if (quiz.start_time && now < quiz.start_time) throw Object.assign(new Error('Quiz has not started yet'), { statusCode: 400 });
  if (quiz.end_time   && now > quiz.end_time)   throw Object.assign(new Error('Quiz has ended'), { statusCode: 400 });

  // Create attempt
  const attempt = await QuizAttempt.create({
    quiz_id:    quizId,
    student_id: student._id,
    school_id:  schoolId,
    total_marks: quiz.total_marks,
    started_at: now,
    status:     'in_progress',
    created_by: student.user_id,
  });

  const questions = await getQuestionsForAttempt(quiz);
  return { attempt, questions, quiz };
};

const getQuestionsForAttempt = async (quiz) => {
  let questions = await QuizQuestion.find({ quiz_id: quiz._id }).sort('order');
  // Remove is_correct from options — student should not see answers
  questions = questions.map(q => ({
    _id:        q._id,
    question:   q.question,
    marks:      q.marks,
    order:      q.order,
    options:    q.options.map((o, i) => ({ _id: o._id, text: o.text, index: i })),
  }));
  // Shuffle if enabled
  if (quiz.shuffle_questions) questions = questions.sort(() => Math.random() - 0.5);
  return questions;
};

// ─── Student: Submit quiz ─────────────────────────────────────────────────────
const submitQuiz = async (attemptId, answers, studentId, schoolId) => {
  const attempt = await QuizAttempt.findOne({ _id: attemptId, student_id: studentId, school_id: schoolId });
  if (!attempt) throw Object.assign(new Error('Attempt not found'), { statusCode: 404 });
  if (attempt.status === 'submitted') throw Object.assign(new Error('Already submitted'), { statusCode: 400 });

  const quiz      = await Quiz.findById(attempt.quiz_id);
  const questions = await QuizQuestion.find({ quiz_id: attempt.quiz_id });

  // Grade answers
  let score = 0;
  const gradedAnswers = answers.map(ans => {
    const question = questions.find(q => q._id.toString() === ans.question_id);
    if (!question) return { question_id: ans.question_id, selected_option: ans.selected_option, is_correct: false, marks_obtained: 0 };

    const selected     = question.options[ans.selected_option];
    const is_correct   = selected?.is_correct || false;
    const marks        = is_correct ? question.marks : 0;
    score             += marks;

    return {
      question_id:     question._id,
      selected_option: ans.selected_option,
      is_correct,
      marks_obtained:  marks,
    };
  });

  const percentage  = attempt.total_marks > 0 ? (score / attempt.total_marks) * 100 : 0;
  const submittedAt = new Date();
  const timeTaken   = Math.floor((submittedAt - attempt.started_at) / 1000);

  await attempt.updateOne({
    answers:      gradedAnswers,
    score,
    percentage:   parseFloat(percentage.toFixed(2)),
    is_pass:      score >= (quiz.pass_marks || 0),
    submitted_at: submittedAt,
    time_taken:   timeTaken,
    status:       'submitted',
  });

  const updated = await QuizAttempt.findById(attemptId);

  // Include correct answers if quiz allows
  let correctAnswers = null;
  if (quiz.show_answers) {
    correctAnswers = questions.map(q => ({
      question_id:     q._id,
      question:        q.question,
      correct_option:  q.options.findIndex(o => o.is_correct),
      explanation:     q.explanation,
    }));
  }

  return { attempt: updated, correctAnswers, quiz };
};

module.exports = {
  createQuiz, getQuizzes, addQuestions, getQuestions,
  publishQuiz, getResults,
  getStudentQuizzes, startQuiz, submitQuiz,
};