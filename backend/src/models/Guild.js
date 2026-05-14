const mongoose = require('mongoose');

const guildSchema = new mongoose.Schema({
  guildId: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  specialization: { type: String, enum: ['builders', 'scientists', 'warriors', 'healers', 'traders', 'explorers', 'creators', 'leaders'], required: true },
  icon: { type: String, default: '⚔️' },
  leaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  maxMembers: { type: Number, default: 20 },
  bonusMultiplier: { type: Number, default: 1.0 },
  description: { type: String, default: '' },
  isRecruiting: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Guild', guildSchema);
