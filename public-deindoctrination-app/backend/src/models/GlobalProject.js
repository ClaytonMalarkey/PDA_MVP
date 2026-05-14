const mongoose = require('mongoose');

const globalProjectSchema = new mongoose.Schema({
  projectId: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, default: '🏗️' },
  category: { type: String, enum: ['infrastructure', 'education', 'research', 'space', 'health', 'economy'], required: true },
  stage: { type: Number, default: 1 }, // 1=Local, 2=City, 3=National, 4=Global, 5=Space
  goalAmount: { type: Number, required: true },
  currentAmount: { type: Number, default: 0 },
  contributors: [{ userId: mongoose.Schema.Types.ObjectId, amount: Number }],
  rewardXP: { type: Number, default: 0 },
  rewardCurrency: { type: Number, default: 0 },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('GlobalProject', globalProjectSchema);
