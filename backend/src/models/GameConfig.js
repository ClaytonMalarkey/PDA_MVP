const mongoose = require('mongoose');

const gameConfigSchema = new mongoose.Schema({
  configKey: { type: String, unique: true, required: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  category: { type: String, enum: ['menus', 'game', 'economy', 'features', 'display', 'background'], default: 'game' },
  description: { type: String, default: '' },
  updatedBy: { type: String, default: 'system' }
}, { timestamps: true });

gameConfigSchema.index({ configKey: 1 });
gameConfigSchema.index({ category: 1 });

module.exports = mongoose.model('GameConfig', gameConfigSchema);
