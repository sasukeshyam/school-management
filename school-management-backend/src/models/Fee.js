const mongoose = require('mongoose');
const auditPlugin = require('../utils/baseSchema');
const { FEE_STATUS, PAYMENT_METHOD, TRANSACTION_TYPE } = require('../constants/enums');

const S = mongoose.Schema.Types.ObjectId;

// ─── FeeGroup ─────────────────────────────────────────────────────────────────
const feeGroupSchema = new mongoose.Schema({
  school_id:   { type: S, ref: 'School', required: true, index: true },
  name:        { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  is_active:   { type: Boolean, default: true },
});
feeGroupSchema.plugin(auditPlugin);
const FeeGroup = mongoose.model('FeeGroup', feeGroupSchema);

// ─── FeeType ──────────────────────────────────────────────────────────────────
const feeTypeSchema = new mongoose.Schema({
  school_id:   { type: S, ref: 'School', required: true, index: true },
  name:        { type: String, required: true, trim: true },
  code:        { type: String, required: true, trim: true, uppercase: true },
  description: { type: String, trim: true },
  is_active:   { type: Boolean, default: true },
});
feeTypeSchema.index({ code: 1, school_id: 1 }, { unique: true });
feeTypeSchema.plugin(auditPlugin);
const FeeType = mongoose.model('FeeType', feeTypeSchema);

// ─── FeeMaster ────────────────────────────────────────────────────────────────
const feeMasterSchema = new mongoose.Schema({
  school_id:      { type: S, ref: 'School',    required: true, index: true },
  session_id:     { type: S, ref: 'Session',   required: true, index: true },
  fee_group_id:   { type: S, ref: 'FeeGroup',  required: true, index: true },
  fee_type_id:    { type: S, ref: 'FeeType',   required: true, index: true },
  class_setup_id: { type: S, ref: 'ClassSetup',index: true }, // null = all classes
  amount:         { type: Number, required: true, min: 0 },
  due_date:       { type: Date },
  is_active:      { type: Boolean, default: true },
});
feeMasterSchema.plugin(auditPlugin);
const FeeMaster = mongoose.model('FeeMaster', feeMasterSchema);

// ─── FeeAssign ────────────────────────────────────────────────────────────────
const feeAssignSchema = new mongoose.Schema({
  school_id:      { type: S, ref: 'School',    required: true, index: true },
  fee_master_id:  { type: S, ref: 'FeeMaster', required: true, index: true },
  student_id:     { type: S, ref: 'Student',   required: true, index: true },
  amount:         { type: Number, required: true, min: 0 },
  discount:       { type: Number, default: 0 },
  fine:           { type: Number, default: 0 },
  due_date:       { type: Date },
  status:         { type: String, enum: FEE_STATUS, default: 'unpaid', index: true },
});
feeAssignSchema.index({ fee_master_id: 1, student_id: 1 }, { unique: true });
feeAssignSchema.plugin(auditPlugin);

// Virtual: net payable
feeAssignSchema.virtual('net_amount').get(function () {
  return this.amount - this.discount + this.fine;
});

const FeeAssign = mongoose.model('FeeAssign', feeAssignSchema);

// ─── FeeCollect ───────────────────────────────────────────────────────────────
// NOTE: student_id removed — derive via fee_assign_id → FeeAssign.student_id
const feeCollectSchema = new mongoose.Schema({
  school_id:      { type: S, ref: 'School',    required: true, index: true },
  fee_assign_id:  { type: S, ref: 'FeeAssign', required: true, index: true },
  amount_paid:    { type: Number, required: true, min: 0 },
  paid_date:      { type: Date, default: Date.now },
  payment_method: { type: String, enum: PAYMENT_METHOD, default: 'cash' },
  transaction_id: { type: String, trim: true },
  receipt_no:     { type: String, trim: true },
  note:           { type: String, trim: true },
  collected_by:   { type: S, ref: 'User' },
});
feeCollectSchema.plugin(auditPlugin);

// After saving a payment, update FeeAssign status
feeCollectSchema.post('save', async function () {
  const FeeAssign = mongoose.model('FeeAssign');
  const assign = await FeeAssign.findById(this.fee_assign_id);
  if (!assign) return;

  const FeeCollect = mongoose.model('FeeCollect');
  const totalPaid = await FeeCollect.aggregate([
    { $match: { fee_assign_id: this.fee_assign_id } },
    { $group: { _id: null, total: { $sum: '$amount_paid' } } },
  ]);

  const paid = totalPaid[0]?.total || 0;
  const netAmount = assign.amount - assign.discount + assign.fine;

  if (paid >= netAmount) assign.status = 'paid';
  else if (paid > 0) assign.status = 'partial';
  await assign.save();
});

const FeeCollect = mongoose.model('FeeCollect', feeCollectSchema);

// ─── Transaction ──────────────────────────────────────────────────────────────
const transactionSchema = new mongoose.Schema({
  school_id:   { type: S, ref: 'School', required: true, index: true },
  type:        { type: String, enum: TRANSACTION_TYPE, required: true },
  description: { type: String, trim: true },
  amount:      { type: Number, required: true },
  date:        { type: Date, default: Date.now },
  reference:   { type: String, trim: true },
  category:    { type: String, trim: true },
});
transactionSchema.plugin(auditPlugin);
const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = { FeeGroup, FeeType, FeeMaster, FeeAssign, FeeCollect, Transaction };
