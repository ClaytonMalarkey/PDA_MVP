const mongoose = require('mongoose');

// Tracks which plugins are installed on which nodes
const nodePluginSchema = new mongoose.Schema({
  nodeId: { type: String, required: true },
  pluginId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isEnabled: { type: Boolean, default: true },
  config: { type: mongoose.Schema.Types.Mixed, default: {} },
  installedAt: { type: Date, default: Date.now }
}, { timestamps: true });

nodePluginSchema.index({ nodeId: 1, pluginId: 1 }, { unique: true });
nodePluginSchema.index({ userId: 1 });

module.exports = mongoose.model('NodePlugin', nodePluginSchema);
