const mongoose = require('mongoose');

const uiConfigSchema = new mongoose.Schema({
  configKey: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  category: {
    type: String,
    enum: ['theme', 'features', 'content', 'layout'],
    required: true
  },
  description: {
    type: String
  }
}, {
  timestamps: true
});

uiConfigSchema.index({ configKey: 1 });
uiConfigSchema.index({ category: 1 });

module.exports = mongoose.model('UIConfig', uiConfigSchema);
