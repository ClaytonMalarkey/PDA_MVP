const mongoose = require('mongoose');

const questSchema = new mongoose.Schema({
  questId: { type: String, unique: true, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ['daily', 'weekly', 'epic'], required: true },
  requirements: {
    tasksToComplete: { type: Number, default: 1 },
    category: { type: String, default: null },
    skillRequired: { type: String, default: null },
    skillLevel: { type: Number, default: 0 },
    hubLevel: { type: Number, default: 0 }
  },
  rewards: {
    xp: { type: Number, default: 0 },
    currency: { type: Number, default: 0 },
    energy: { type: Number, default: 0 },
    influencePoints: { type: Number, default: 0 },
    innovationTokens: { type: Number, default: 0 },
    legacyStones: { type: Number, default: 0 },
    skillPoints: { type: String, default: null }, // e.g. "coding"
    skillAmount: { type: Number, default: 0 },
    hubUpgrade: { type: Boolean, default: false }
  },
  icon: { type: String, default: '📋' },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

questSchema.index({ type: 1, isActive: 1 });
module.exports = mongoose.model('Quest', questSchema);
