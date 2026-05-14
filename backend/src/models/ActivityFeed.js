const mongoose = require('mongoose');

const activityFeedSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: [
    'task_complete', 'level_up', 'achievement', 'plugin_install', 'plugin_publish',
    'node_register', 'node_online', 'structure_build', 'research_complete',
    'join_alliance', 'streak_milestone', 'purchase', 'challenge_win',
    'friend_add', 'guild_join', 'project_contribute', 'system'
  ], required: true },
  message: { type: String, required: true },
  icon: { type: String, default: '📌' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  isPublic: { type: Boolean, default: true },
  isGlobal: { type: Boolean, default: false } // system-wide announcements
}, { timestamps: true });

activityFeedSchema.index({ createdAt: -1 });
activityFeedSchema.index({ userId: 1, createdAt: -1 });
activityFeedSchema.index({ isPublic: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityFeed', activityFeedSchema);
