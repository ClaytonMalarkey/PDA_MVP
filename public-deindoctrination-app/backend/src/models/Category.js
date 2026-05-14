const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  description: {
    type: String,
    maxlength: 200,
    default: ''
  },
  icon: {
    type: String,
    default: '📁'
  },
  color: {
    type: String,
    default: '#6366f1',
    match: /^#[0-9A-Fa-f]{6}$/
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
categorySchema.index({ name: 1 }, { unique: true });
categorySchema.index({ isActive: 1 });

// Virtual for task count
categorySchema.virtual('taskCount', {
  ref: 'Task',
  localField: 'name',
  foreignField: 'category',
  count: true
});

// Ensure virtuals are included in JSON
categorySchema.set('toJSON', { virtuals: true });
categorySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Category', categorySchema);
