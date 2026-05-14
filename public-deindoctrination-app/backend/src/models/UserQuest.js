const mongoose = require('mongoose');

const userQuestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  questId: { type: String, required: true },
  progress: { type: Number, default: 0 },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
  assignedAt: { type: Date, default: Date.now }
}, { timestamps: true });

userQuestSchema.index({ userId: 1, questId: 1 });
userQuestSchema.index({ userId: 1, isCompleted: 1 });
module.exports = mongoose.model('UserQuest', userQuestSchema);
