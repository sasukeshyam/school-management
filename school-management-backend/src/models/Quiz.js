const mongoose = require('mongoose');
const auditPlugin = require('../utils/baseSchema');

const S = mongoose.Schema.Types.ObjectId;

// ─── Quiz ─────────────────────────────────────────────────────────────────────
const quizSchema = new mongoose.Schema({
  school_id:          { type: S, ref: 'School',   required: true, index: true },
  session_id:         { type: S, ref: 'Session',  required: true, index: true },
  subject_id:         { type: S, ref: 'Subject',  required: true },
  teacher_id:         { type: S, ref: 'Teacher',  required: true },
  class_setup_ids:    [{ type: S, ref: 'ClassSetup' }],  // multiple classes
  title:              { type: String, required: true, trim: true },
  description:        { type: String, trim: true },
  instructions:       { type: String, trim: true },
  time_limit:         { type: Number, default: 30 },   // minutes, 0 = no limit
  total_marks:        { type: Number, default: 0 },    // auto-calculated
  total_questions:    { type: Number, default: 0 },
  pass_marks:         { type: Number, default: 0 },
  start_time:         { type: Date },
  end_time:           { type: Date },
  shuffle_questions:  { type: Boolean, default: false },
  show_result:        { type: Boolean, default: true },  // show result immediately
  show_answers:       { type: Boolean, default: false }, // show correct answers
  allow_reattempt:    { type: Boolean, default: false },
  status:             { type: String, enum: ['draft','published','ended'], default: 'draft', index: true },
});

quizSchema.plugin(auditPlugin);
const Quiz = mongoose.model('Quiz', quizSchema);

// ─── Quiz Question ─────────────────────────────────────────────────────────────
const quizQuestionSchema = new mongoose.Schema({
  school_id:     { type: S, ref: 'School', required: true, index: true },
  quiz_id:       { type: S, ref: 'Quiz',   required: true, index: true },
  question:      { type: String, required: true, trim: true },
  options:       [{
    text:        { type: String, required: true, trim: true },
    is_correct:  { type: Boolean, default: false },
  }],
  marks:         { type: Number, default: 1 },
  explanation:   { type: String, trim: true },  // shown after attempt
  order:         { type: Number, default: 0 },
});

quizQuestionSchema.plugin(auditPlugin);
const QuizQuestion = mongoose.model('QuizQuestion', quizQuestionSchema);

// ─── Quiz Attempt ─────────────────────────────────────────────────────────────
const quizAttemptSchema = new mongoose.Schema({
  school_id:    { type: S, ref: 'School',  required: true, index: true },
  quiz_id:      { type: S, ref: 'Quiz',    required: true, index: true },
  student_id:   { type: S, ref: 'Student', required: true, index: true },
  answers: [{
    question_id:     { type: S, ref: 'QuizQuestion' },
    selected_option: { type: Number, default: null },  // index of selected option
    is_correct:      { type: Boolean, default: false },
    marks_obtained:  { type: Number, default: 0 },
  }],
  score:         { type: Number, default: 0 },
  total_marks:   { type: Number, default: 0 },
  percentage:    { type: Number, default: 0 },
  is_pass:       { type: Boolean, default: false },
  started_at:    { type: Date, default: Date.now },
  submitted_at:  { type: Date },
  time_taken:    { type: Number, default: 0 },  // seconds
  status:        { type: String, enum: ['in_progress','submitted','timed_out'], default: 'in_progress' },
});

quizAttemptSchema.index({ quiz_id: 1, student_id: 1 }, { unique: true });
quizAttemptSchema.plugin(auditPlugin);
const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);

module.exports = { Quiz, QuizQuestion, QuizAttempt };