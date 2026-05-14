const mongoose = require('mongoose');

const researchProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  nodeId: { type: String, required: true },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
  isCompleted: { type: Boolean, default: false }
}, { timestamps: true });

researchProgressSchema.index({ userId: 1, nodeId: 1 }, { unique: true });
researchProgressSchema.index({ userId: 1, isCompleted: 1 });

module.exports = mongoose.model('ResearchProgress', researchProgressSchema);
