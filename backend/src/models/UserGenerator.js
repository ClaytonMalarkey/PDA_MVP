const mongoose = require('mongoose');

const userGeneratorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  generatorId: { type: String, required: true },
  level: { type: Number, default: 1 },
  isAutomated: { type: Boolean, default: false },
  purchasedAt: { type: Date, default: Date.now }
}, { timestamps: true });

userGeneratorSchema.index({ userId: 1, generatorId: 1 }, { unique: true });
module.exports = mongoose.model('UserGenerator', userGeneratorSchema);
