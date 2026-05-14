const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  taskId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    ref: 'Category'
  },
  xpReward: {
    type: Number,
    required: true,
    min: 0
  },
  currencyReward: {
    type: Number,
    required: true,
    min: 0
  },
  cooldown: {
    type: Number,
    required: true,
    min: 0
  },
  requiresVerification: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  realReward: {
    type: String,
    default: null
  },
  taskCheck: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
taskSchema.index({ category: 1, isActive: 1 });
taskSchema.index({ taskId: 1 });

module.exports = mongoose.model('Task', taskSchema);
