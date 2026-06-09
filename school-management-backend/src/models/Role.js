const mongoose = require('mongoose');
const auditPlugin = require('../utils/baseSchema');

// ─── Permission ───────────────────────────────────────────────────────────────
const permissionSchema = new mongoose.Schema({
  name:   { type: String, required: true, trim: true },
  slug:   { type: String, required: true, unique: true, lowercase: true, trim: true },
  module: { type: String, required: true, trim: true },
  action: { type: String, required: true, trim: true },
  description: { type: String },
});

const Permission = mongoose.model('Permission', permissionSchema);

// ─── Role ─────────────────────────────────────────────────────────────────────
const roleSchema = new mongoose.Schema({
  school_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  name:        { type: String, required: true, trim: true },
  slug:        { type: String, required: true, lowercase: true, trim: true },
  description: { type: String },
  is_system:   { type: Boolean, default: false }, // system roles cannot be deleted
  permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }],
});

roleSchema.index({ slug: 1, school_id: 1 }, { unique: true });
roleSchema.plugin(auditPlugin);

const Role = mongoose.model('Role', roleSchema);

// ─── UserRole ─────────────────────────────────────────────────────────────────
const userRoleSchema = new mongoose.Schema({
  school_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  user_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  role_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
  assigned_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assigned_at: { type: Date, default: Date.now },
});

userRoleSchema.index({ user_id: 1, role_id: 1, school_id: 1 }, { unique: true });

const UserRole = mongoose.model('UserRole', userRoleSchema);

module.exports = { Permission, Role, UserRole };
