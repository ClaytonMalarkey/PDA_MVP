const mongoose = require('mongoose');

const researchNodeSchema = new mongoose.Schema({
  nodeId: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  domain: { type: String, required: true },
  subdomain: { type: String, required: true },
  tier: { type: Number, required: true, min: 1, max: 10 },
  cost: { type: Number, required: true },
  researchTime: { type: Number, required: true }, // seconds
  xpReward: { type: Number, required: true },
  dependencies: [String],
  unlocks: {
    globalMultiplier: { type: Number, default: 1 },
    productionBoost: { type: Number, default: 0 },
    description: { type: String, default: '' }
  }
}, { timestamps: true });

researchNodeSchema.index({ domain: 1, tier: 1 });
researchNodeSchema.index({ nodeId: 1 });

module.exports = mongoose.model('ResearchNode', researchNodeSchema);
