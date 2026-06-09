const mongoose = require('mongoose');

// Adds audit fields to every schema: created_at, updated_at, created_by, is_deleted, deleted_at
const auditPlugin = (schema) => {
  schema.add({
    created_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    is_deleted:  { type: Boolean, default: false, index: true },
    deleted_at:  { type: Date, default: null },
    deleted_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  });

  schema.set('timestamps', { createdAt: 'created_at', updatedAt: 'updated_at' });

  // Soft delete method
  schema.methods.softDelete = async function (userId) {
    this.is_deleted = true;
    this.deleted_at = new Date();
    this.deleted_by = userId;
    return this.save();
  };

  // Auto-exclude soft deleted on all finds
  schema.pre(/^find/, function () {
    if (this._conditions.is_deleted === undefined) {
      this.where({ is_deleted: false });
    }
  });
};

module.exports = auditPlugin;
