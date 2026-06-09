const mongoose = require('mongoose');
const auditPlugin = require('../utils/baseSchema');
const {
  EXAM_STATUS, ADMIT_CARD_STATUS, MARKSHEET_STATUS, ATTENDANCE_STATUS,
} = require('../constants/enums');

const S = mongoose.Schema.Types.ObjectId;

// ─── Attendance ───────────────────────────────────────────────────────────────
const attendanceSchema = new mongoose.Schema({
  school_id:      { type: S, ref: 'School',    required: true, index: true },
  session_id:     { type: S, ref: 'Session',   required: true, index: true },
  class_setup_id: { type: S, ref: 'ClassSetup',required: true, index: true },
  subject_id:     { type: S, ref: 'Subject',   index: true }, // optional subject-wise
  student_id:     { type: S, ref: 'Student',   required: true, index: true },
  date:           { type: Date, required: true, index: true },
  status:         { type: String, enum: ATTENDANCE_STATUS, default: 'present' },
  is_holiday:     { type: Boolean, default: false },
  note:           { type: String, trim: true },
  marked_by:      { type: S, ref: 'User' },
});
attendanceSchema.index({ student_id: 1, date: 1, class_setup_id: 1, subject_id: 1 }, { unique: true });
attendanceSchema.plugin(auditPlugin);
const Attendance = mongoose.model('Attendance', attendanceSchema);

// ─── StudentLeave ─────────────────────────────────────────────────────────────
const studentLeaveSchema = new mongoose.Schema({
  school_id:   { type: S, ref: 'School',  required: true, index: true },
  student_id:  { type: S, ref: 'Student', required: true, index: true },
  reason:      { type: String, required: true, trim: true },
  from_date:   { type: Date, required: true },
  to_date:     { type: Date, required: true },
  documents:   [{ url: String, name: String }],
  status:      { type: String, enum: ['pending','approved','rejected','cancelled'], default: 'pending' },
  approved_by: { type: S, ref: 'User' },
  remarks:     { type: String, trim: true },
});
studentLeaveSchema.plugin(auditPlugin);
const StudentLeave = mongoose.model('StudentLeave', studentLeaveSchema);

// ─── ExamType ─────────────────────────────────────────────────────────────────
const examTypeSchema = new mongoose.Schema({
  school_id: { type: S, ref: 'School', required: true, index: true },
  name:      { type: String, required: true, trim: true },
  code:      { type: String, required: true, trim: true, uppercase: true },
  is_active: { type: Boolean, default: true },
});
examTypeSchema.index({ code: 1, school_id: 1 }, { unique: true });
examTypeSchema.plugin(auditPlugin);
const ExamType = mongoose.model('ExamType', examTypeSchema);

// ─── MarkGrade ────────────────────────────────────────────────────────────────
const markGradeSchema = new mongoose.Schema({
  school_id: { type: S, ref: 'School', required: true, index: true },
  grade:     { type: String, required: true, trim: true },
  point:     { type: String, required: true },
  min_mark:  { type: Number, required: true },
  max_mark:  { type: Number, required: true },
  remark:    { type: String, trim: true },
  is_active: { type: Boolean, default: true },
});
markGradeSchema.plugin(auditPlugin);
const MarkGrade = mongoose.model('MarkGrade', markGradeSchema);

// ─── Exam ─────────────────────────────────────────────────────────────────────
const examSchema = new mongoose.Schema({
  school_id:      { type: S, ref: 'School',    required: true, index: true },
  session_id:     { type: S, ref: 'Session',   required: true, index: true },
  class_setup_id: { type: S, ref: 'ClassSetup',required: true, index: true },
  exam_type_id:   { type: S, ref: 'ExamType',  required: true },
  title:          { type: String, required: true, trim: true },
  total_marks:    { type: Number, required: true },
  passing_marks:  { type: Number, required: true },
  status:         { type: String, enum: EXAM_STATUS, default: 'draft', index: true },
});
examSchema.plugin(auditPlugin);
const Exam = mongoose.model('Exam', examSchema);

// ─── ExamAssign ───────────────────────────────────────────────────────────────
const examAssignSchema = new mongoose.Schema({
  school_id:         { type: S, ref: 'School',  required: true, index: true },
  exam_id:           { type: S, ref: 'Exam',    required: true, index: true },
  subject_id:        { type: S, ref: 'Subject', required: true, index: true },
  total_marks:       { type: Number, required: true },
  passing_marks:     { type: Number },
  mark_distribution: { type: String, trim: true },
});
examAssignSchema.index({ exam_id: 1, subject_id: 1 }, { unique: true });
examAssignSchema.plugin(auditPlugin);
const ExamAssign = mongoose.model('ExamAssign', examAssignSchema);

// ─── ExamRoutine ──────────────────────────────────────────────────────────────
const examRoutineSchema = new mongoose.Schema({
  school_id:      { type: S, ref: 'School',    required: true, index: true },
  exam_id:        { type: S, ref: 'Exam',      required: true, index: true },
  class_setup_id: { type: S, ref: 'ClassSetup',required: true, index: true },
  subject_id:     { type: S, ref: 'Subject',   required: true },
  exam_date:      { type: Date, required: true },
  start_time:     { type: String, required: true },
  end_time:       { type: String, required: true },
  room:           { type: String, trim: true },
  seat_plan:      { type: String, trim: true },
});
examRoutineSchema.plugin(auditPlugin);
const ExamRoutine = mongoose.model('ExamRoutine', examRoutineSchema);

// ─── MarkRegister ─────────────────────────────────────────────────────────────
const markRegisterSchema = new mongoose.Schema({
  school_id:      { type: S, ref: 'School',     required: true, index: true },
  exam_assign_id: { type: S, ref: 'ExamAssign', required: true, index: true },
  student_id:     { type: S, ref: 'Student',    required: true, index: true },
  marks_obtained: { type: Number, required: true, default: 0 },
  grade_id:       { type: S, ref: 'MarkGrade' },
  is_pass:        { type: Boolean, default: false },
  is_absent:      { type: Boolean, default: false },
  remarks:        { type: String, trim: true },
  entered_by:     { type: S, ref: 'User' },
});
markRegisterSchema.index({ exam_assign_id: 1, student_id: 1 }, { unique: true });
markRegisterSchema.plugin(auditPlugin);
const MarkRegister = mongoose.model('MarkRegister', markRegisterSchema);

// ─── AdmitCard ────────────────────────────────────────────────────────────────
const admitCardSchema = new mongoose.Schema({
  school_id:   { type: S, ref: 'School',  required: true, index: true },
  student_id:  { type: S, ref: 'Student', required: true, index: true },
  exam_id:     { type: S, ref: 'Exam',    required: true, index: true },
  seat_number: { type: String, trim: true },
  status:      { type: String, enum: ADMIT_CARD_STATUS, default: 'draft' },
  approved_by: { type: S, ref: 'User' },
  issued_at:   { type: Date },
});
admitCardSchema.index({ student_id: 1, exam_id: 1 }, { unique: true });
admitCardSchema.plugin(auditPlugin);
const AdmitCard = mongoose.model('AdmitCard', admitCardSchema);

// ─── Marksheet ────────────────────────────────────────────────────────────────
const marksheetSchema = new mongoose.Schema({
  school_id:      { type: S, ref: 'School',  required: true, index: true },
  student_id:     { type: S, ref: 'Student', required: true, index: true },
  exam_id:        { type: S, ref: 'Exam',    required: true, index: true },
  total_obtained: { type: Number, default: 0 },
  total_marks:    { type: Number, default: 0 },
  percentage:     { type: Number, default: 0 },
  final_grade:    { type: String, trim: true },
  final_point:    { type: String, trim: true },
  is_pass:        { type: Boolean, default: false },
  rank:           { type: Number },
  status:         { type: String, enum: MARKSHEET_STATUS, default: 'draft' },
  approved_by:    { type: S, ref: 'User' },
  published_at:   { type: Date },
});
marksheetSchema.index({ student_id: 1, exam_id: 1 }, { unique: true });
marksheetSchema.plugin(auditPlugin);
const Marksheet = mongoose.model('Marksheet', marksheetSchema);

module.exports = {
  Attendance, StudentLeave,
  ExamType, MarkGrade, Exam, ExamAssign, ExamRoutine,
  MarkRegister, AdmitCard, Marksheet,
};
