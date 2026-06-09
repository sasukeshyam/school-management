const mongoose = require('mongoose');
const auditPlugin = require('../utils/baseSchema');
const { STUDENT_STATUS, BLOOD_GROUP, GENDER, GUARDIAN_RELATION } = require('../constants/enums');

// ─── Parent ───────────────────────────────────────────────────────────────────
const parentSchema = new mongoose.Schema({
  school_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  user_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  occupation:  { type: String, trim: true },
  national_id: { type: String, trim: true },
  address:     { type: String, trim: true },
});
parentSchema.plugin(auditPlugin);
const Parent = mongoose.model('Parent', parentSchema);

// ─── Student ──────────────────────────────────────────────────────────────────
const studentSchema = new mongoose.Schema({
  school_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  user_id:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  class_setup_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'ClassSetup', index: true },
  session_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Session', index: true },
  roll_number:     { type: String, trim: true },
  admission_no:    { type: String, trim: true },
  dob:             { type: Date },
  gender:          { type: String, enum: GENDER },
  blood_group:     { type: String, enum: BLOOD_GROUP },
  religion:        { type: String, trim: true },
  address:         { type: String, trim: true },
  enrollment_date: { type: Date, default: Date.now },
  status:          { type: String, enum: STUDENT_STATUS, default: 'active', index: true },
});

// Unique admission_no per school
studentSchema.index({ admission_no: 1, school_id: 1 }, { unique: true, sparse: true });
// Unique roll_number per class+session
studentSchema.index({ roll_number: 1, class_setup_id: 1, session_id: 1 }, { unique: true, sparse: true });
studentSchema.plugin(auditPlugin);
const Student = mongoose.model('Student', studentSchema);

// ─── StudentParent (junction) ─────────────────────────────────────────────────
const studentParentSchema = new mongoose.Schema({
  school_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  parent_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Parent', required: true, index: true },
  relation:   { type: String, enum: GUARDIAN_RELATION, required: true },
  is_primary: { type: Boolean, default: false },
});
studentParentSchema.index({ student_id: 1, parent_id: 1 }, { unique: true });
studentParentSchema.plugin(auditPlugin);
const StudentParent = mongoose.model('StudentParent', studentParentSchema);

module.exports = { Student, Parent, StudentParent };
