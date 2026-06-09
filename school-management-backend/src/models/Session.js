const mongoose = require('mongoose');
const auditPlugin = require('../utils/baseSchema');

const sessionSchema = new mongoose.Schema({
  school_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  name:       { type: String, required: true, trim: true },
  year:       { type: Number, required: true },
  start_date: { type: Date, required: true },
  end_date:   { type: Date, required: true },
  is_current: { type: Boolean, default: false },
  is_active:  { type: Boolean, default: true },
});

sessionSchema.plugin(auditPlugin);

// Only one current session per school
sessionSchema.pre('save', async function (next) {
  if (this.isModified('is_current') && this.is_current) {
    await this.constructor.updateMany(
      { school_id: this.school_id, _id: { $ne: this._id } },
      { is_current: false }
    );
  }
  next();
});

module.exports = mongoose.model('Session', sessionSchema);
