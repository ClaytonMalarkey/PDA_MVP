const mongoose = require('mongoose');

const civilizationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  leaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  governanceType: {
    type: String,
    enum: ['meritocratic', 'democratic', 'technocratic', 'cooperative'],
    default: 'democratic'
  },
  stabilityScore: { type: Number, default: 100, min: 0, max: 100 },
  totalResources: { type: Number, default: 0 },
  researchLevel: { type: Number, default: 0 },
  territoryCount: { type: Number, default: 1 },
  globalMultiplier: { type: Number, default: 1 },
  icon: { type: String, default: '🏛️' },
  description: { type: String, default: '' }
}, { timestamps: true });

civilizationSchema.index({ name: 1 });
civilizationSchema.index({ leaderId: 1 });

module.exports = mongoose.model('Civilization', civilizationSchema);
