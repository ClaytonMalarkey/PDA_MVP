const mongoose = require('mongoose');

const nodeSchema = new mongoose.Schema({
  nodeId: { type: String, unique: true, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, default: 'My Node' },
  type: { type: String, enum: ['browser', 'desktop', 'mobile', 'server', 'iot'], default: 'browser' },
  capabilities: [{ type: String, enum: ['compute', 'storage', 'input', 'camera', 'gps', 'network', 'display', 'audio'] }],
  status: { type: String, enum: ['online', 'offline', 'idle', 'busy'], default: 'offline' },
  lastHeartbeat: { type: Date, default: Date.now },
  metadata: {
    userAgent: String,
    platform: String,
    screenRes: String,
    ip: String
  },
  installedPlugins: [{ type: String }], // plugin IDs
  stats: {
    tasksExecuted: { type: Number, default: 0 },
    uptime: { type: Number, default: 0 }, // seconds
    commandsReceived: { type: Number, default: 0 },
    dataTransferred: { type: Number, default: 0 } // bytes
  }
}, { timestamps: true });

nodeSchema.index({ userId: 1 });
nodeSchema.index({ status: 1 });
nodeSchema.index({ nodeId: 1 });

module.exports = mongoose.model('Node', nodeSchema);
