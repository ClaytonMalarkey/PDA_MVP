const mongoose = require('mongoose');

const incomeGeneratorSchema = new mongoose.Schema({
  generatorId: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, default: '💼' },
  baseCost: { type: Number, required: true },
  baseIncome: { type: Number, required: true }, // per hour
  category: { type: String, enum: ['freelance', 'passive', 'business', 'venture'], required: true },
  requiredHubLevel: { type: Number, default: 1 },
  requiredSkill: { type: String, default: null },
  requiredSkillLevel: { type: Number, default: 0 },
  maxLevel: { type: Number, default: 50 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('IncomeGenerator', incomeGeneratorSchema);
