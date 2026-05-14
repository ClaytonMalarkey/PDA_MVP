const mongoose = require('mongoose');

const userTaskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  taskId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['completed', 'pending', 'rejected'],
    default: 'completed'
  },
  completedAt: {
    type: Date,
    default: Date.now
  },
  proof: {
    type: String
  },
  submission: {
    content: String,
    aiAssisted: {
      type: Boolean,
      default: false
    },
    submittedAt: Date
  },
  xpAwarded: {
    type: Number,
    default: 0
  },
  currencyAwarded: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
userTaskSchema.index({ userId: 1, taskId: 1 });
userTaskSchema.index({ userId: 1, completedAt: -1 });
userTaskSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('UserTask', userTaskSchema);
