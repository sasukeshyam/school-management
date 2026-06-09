const mongoose = require('mongoose');
const auditPlugin = require('../utils/baseSchema');
const { SUBJECT_TYPE, DAY_OF_WEEK } = require('../constants/enums');

const S = mongoose.Schema.Types.ObjectId;

// ─── Class ────────────────────────────────────────────────────────────────────
const classSchema = new mongoose.Schema({
  school_id:     { type: S, ref: 'School', required: true, index: true },
  name:          { type: String, required: true, trim: true },
  numeric_value: { type: Number },
  is_active:     { type: Boolean, default: true },
});
classSchema.plugin(auditPlugin);
const Class = mongoose.model('Class', classSchema);

// ─── Section ──────────────────────────────────────────────────────────────────
const sectionSchema = new mongoose.Schema({
  school_id: { type: S, ref: 'School', required: true, index: true },
  name:      { type: String, required: true, trim: true },
  is_active: { type: Boolean, default: true },
});
sectionSchema.plugin(auditPlugin);
const Section = mongoose.model('Section', sectionSchema);

// ─── Shift ────────────────────────────────────────────────────────────────────
const shiftSchema = new mongoose.Schema({
  school_id:  { type: S, ref: 'School', required: true, index: true },
  name:       { type: String, required: true, trim: true },
  start_time: { type: String, required: true },
  end_time:   { type: String, required: true },
  is_active:  { type: Boolean, default: true },
});
shiftSchema.plugin(auditPlugin);
const Shift = mongoose.model('Shift', shiftSchema);

// ─── ClassSetup ───────────────────────────────────────────────────────────────
const classSetupSchema = new mongoose.Schema({
  school_id:        { type: S, ref: 'School', required: true, index: true },
  session_id:       { type: S, ref: 'Session', required: true, index: true },
  class_id:         { type: S, ref: 'Class', required: true, index: true },
  section_id:       { type: S, ref: 'Section', required: true },
  shift_id:         { type: S, ref: 'Shift' },
  class_teacher_id: { type: S, ref: 'Teacher' },
  room:             { type: String, trim: true },
  capacity:         { type: Number, default: 40 },
  is_active:        { type: Boolean, default: true },
});
classSetupSchema.index({ class_id: 1, section_id: 1, session_id: 1, school_id: 1 }, { unique: true });
classSetupSchema.plugin(auditPlugin);
const ClassSetup = mongoose.model('ClassSetup', classSetupSchema);

// ─── Subject ──────────────────────────────────────────────────────────────────
const subjectSchema = new mongoose.Schema({
  school_id: { type: S, ref: 'School', required: true, index: true },
  name:      { type: String, required: true, trim: true },
  code:      { type: String, required: true, trim: true, uppercase: true },
  type:      { type: String, enum: SUBJECT_TYPE, default: 'theory' },
  is_active: { type: Boolean, default: true },
});
subjectSchema.index({ code: 1, school_id: 1 }, { unique: true });
subjectSchema.plugin(auditPlugin);
const Subject = mongoose.model('Subject', subjectSchema);

// ─── SubjectAssign ────────────────────────────────────────────────────────────
const subjectAssignSchema = new mongoose.Schema({
  school_id:      { type: S, ref: 'School', required: true, index: true },
  session_id:     { type: S, ref: 'Session', required: true, index: true },
  class_setup_id: { type: S, ref: 'ClassSetup', required: true, index: true },
  subject_id:     { type: S, ref: 'Subject', required: true, index: true },
  teacher_id:     { type: S, ref: 'Teacher', required: true },
});
subjectAssignSchema.index({ class_setup_id: 1, subject_id: 1, session_id: 1 }, { unique: true });
subjectAssignSchema.plugin(auditPlugin);
const SubjectAssign = mongoose.model('SubjectAssign', subjectAssignSchema);

// ─── ClassRoutine ─────────────────────────────────────────────────────────────
const classRoutineSchema = new mongoose.Schema({
  school_id:      { type: S, ref: 'School', required: true, index: true },
  class_setup_id: { type: S, ref: 'ClassSetup', required: true, index: true },
  subject_id:     { type: S, ref: 'Subject', required: true },
  teacher_id:     { type: S, ref: 'Teacher', required: true },
  day_of_week:    { type: String, enum: DAY_OF_WEEK, required: true },
  start_time:     { type: String, required: true },
  end_time:       { type: String, required: true },
  room:           { type: String, trim: true },
});
classRoutineSchema.plugin(auditPlugin);
const ClassRoutine = mongoose.model('ClassRoutine', classRoutineSchema);

// ─── LessonPlan ───────────────────────────────────────────────────────────────
const lessonPlanSchema = new mongoose.Schema({
  school_id:      { type: S, ref: 'School', required: true, index: true },
  class_setup_id: { type: S, ref: 'ClassSetup', required: true, index: true },
  subject_id:     { type: S, ref: 'Subject', required: true, index: true },
  teacher_id:     { type: S, ref: 'Teacher', required: true },
  topic:          { type: String, required: true, trim: true },
  objectives:     { type: String, trim: true },
  content:        { type: String, trim: true },
  resources:      { type: String, trim: true },
  plan_date:      { type: Date, required: true },
});
lessonPlanSchema.plugin(auditPlugin);
const LessonPlan = mongoose.model('LessonPlan', lessonPlanSchema);

// ─── StudyMaterial ────────────────────────────────────────────────────────────
const studyMaterialSchema = new mongoose.Schema({
  school_id:      { type: S, ref: 'School', required: true, index: true },
  class_setup_id: { type: S, ref: 'ClassSetup', required: true, index: true },
  subject_id:     { type: S, ref: 'Subject', required: true, index: true },
  teacher_id:     { type: S, ref: 'Teacher', required: true },
  title:          { type: String, required: true, trim: true },
  description:    { type: String, trim: true },
  files:          [{ url: String, name: String, type: String }],
  is_active:      { type: Boolean, default: true },
});
studyMaterialSchema.plugin(auditPlugin);
const StudyMaterial = mongoose.model('StudyMaterial', studyMaterialSchema);

module.exports = { Class, Section, Shift, ClassSetup, Subject, SubjectAssign, ClassRoutine, LessonPlan, StudyMaterial };
