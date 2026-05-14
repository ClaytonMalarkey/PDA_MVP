const mongoose = require('mongoose');

const avatarSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
  title: { type: String, default: 'Newcomer' },
  frame: { type: String, default: 'basic' },
  badge: { type: String, default: '' },
  trail: { type: String, default: 'none' },
  aura: { type: String, default: 'none' },
  unlockedTitles: [String],
  unlockedFrames: [String],
  unlockedTrails: [String],
  unlockedAuras: [String],
  reputation: { type: Number, default: 0 },
  contributionScore: { type: Number, default: 0 },
  lifetimeXP: { type: Number, default: 0 },
  lifetimeCredits: { type: Number, default: 0 },
  lifetimeTasks: { type: Number, default: 0 },
  lifetimeKills: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Avatar', avatarSchema);
