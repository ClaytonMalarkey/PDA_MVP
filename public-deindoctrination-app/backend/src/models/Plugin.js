const mongoose = require('mongoose');

const pluginSchema = new mongoose.Schema({
  pluginId: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  version: { type: String, default: '1.0.0' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  authorName: { type: String, default: 'System' },
  icon: { type: String, default: '🔌' },
  category: { type: String, enum: ['utility', 'productivity', 'social', 'game', 'storage', 'compute', 'communication', 'security', 'analytics'], default: 'utility' },
  permissions: [{ type: String, enum: ['network', 'storage', 'input', 'camera', 'gps', 'compute', 'audio', 'display', 'system'] }],
  actions: [{
    name: { type: String, required: true },
    description: String,
    params: mongoose.Schema.Types.Mixed
  }],
  config: { type: mongoose.Schema.Types.Mixed, default: {} },
  // Marketplace
  isPublished: { type: Boolean, default: false },
  isSystem: { type: Boolean, default: false }, // built-in plugins
  isPaid: { type: Boolean, default: false },
  price: { type: Number, default: 0 }, // in credits
  downloads: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  tags: [String],
  // Status
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

pluginSchema.index({ pluginId: 1 });
pluginSchema.index({ category: 1, isPublished: 1 });
pluginSchema.index({ isPublished: 1, downloads: -1 });

module.exports = mongoose.model('Plugin', pluginSchema);
