const mongoose = require('mongoose');
const auditPlugin = require('../utils/baseSchema');

// ─── Teacher ──────────────────────────────────────────────────────────────────
const teacherSchema = new mongoose.Schema({
  school_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  user_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  employee_id:  { type: String, trim: true },
  department:   { type: String, trim: true },
  designation:  { type: String, trim: true },
  qualification:{ type: String, trim: true },
  experience:   { type: String, trim: true },
  join_date:    { type: Date },
  is_active:    { type: Boolean, default: true },
});

teacherSchema.index({ employee_id: 1, school_id: 1 }, { unique: true, sparse: true });
teacherSchema.plugin(auditPlugin);
const Teacher = mongoose.model('Teacher', teacherSchema);

// ─── Staff ────────────────────────────────────────────────────────────────────
const staffSchema = new mongoose.Schema({
  school_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  user_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  employee_id: { type: String, trim: true },
  designation: { type: String, trim: true },
  department:  { type: String, trim: true },
  salary:      { type: Number, default: 0 },
  join_date:   { type: Date },
  is_active:   { type: Boolean, default: true },
});

staffSchema.index({ employee_id: 1, school_id: 1 }, { unique: true, sparse: true });
staffSchema.plugin(auditPlugin);
const Staff = mongoose.model('Staff', staffSchema);

module.exports = { Teacher, Staff };
