const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const auditPlugin = require('../utils/baseSchema');

const userSchema = new mongoose.Schema({
  school_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  name:           { type: String, required: true, trim: true },
  email:          { type: String, required: true, lowercase: true, trim: true },
  password_hash:  { type: String, required: true, select: false },
  phone:          { type: String, trim: true },
  avatar:         { type: String },
  is_active:      { type: Boolean, default: true, index: true },
  refresh_token:  { type: String, select: false },
  last_login:     { type: Date },
});

// Compound unique: email per school
userSchema.index({ email: 1, school_id: 1 }, { unique: true });

userSchema.plugin(auditPlugin);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password_hash')) return next();
  this.password_hash = await bcrypt.hash(this.password_hash, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password_hash);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password_hash;
  delete obj.refresh_token;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
