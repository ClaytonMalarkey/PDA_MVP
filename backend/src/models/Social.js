const mongoose = require('mongoose');

// Friend relationships
const friendSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  friendId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'blocked'], default: 'pending' },
  since: { type: Date, default: Date.now }
}, { timestamps: true });
friendSchema.index({ userId: 1, friendId: 1 }, { unique: true });

// Chat messages
const chatSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null = global
  civilizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Civilization', default: null },
  message: { type: String, required: true, maxlength: 500 },
  type: { type: String, enum: ['text', 'achievement', 'challenge', 'gift'], default: 'text' }
}, { timestamps: true });
chatSchema.index({ createdAt: -1 });

// Activity feed
const activitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['task_complete', 'level_up', 'kill_boss', 'build', 'research', 'join_alliance', 'achievement', 'gift_sent', 'challenge_won', 'streak_milestone', 'daily_login', 'powerup'], required: true },
  message: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed },
  isPublic: { type: Boolean, default: true }
}, { timestamps: true });
activitySchema.index({ createdAt: -1 });
activitySchema.index({ userId: 1, createdAt: -1 });

// Challenges (player vs player)
const challengeSchema = new mongoose.Schema({
  challengerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['kills', 'crystals', 'xp', 'tasks', 'score'], required: true },
  goal: { type: Number, required: true },
  wager: { type: Number, default: 0 },
  challengerProgress: { type: Number, default: 0 },
  targetProgress: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'active', 'completed', 'declined'], default: 'pending' },
  winnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });
challengeSchema.index({ challengerId: 1, status: 1 });
challengeSchema.index({ targetId: 1, status: 1 });

// Gifts
const giftSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['credits', 'energy', 'powerup'], required: true },
  amount: { type: Number, default: 0 },
  claimed: { type: Boolean, default: false }
}, { timestamps: true });

// Achievements
const achievementSchema = new mongoose.Schema({
  achievementId: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, default: '🏅' },
  category: { type: String, enum: ['combat', 'exploration', 'social', 'building', 'streak', 'wealth', 'mastery'], required: true },
  requirement: { type: String, required: true }, // e.g. 'kills>=10'
  rewardXP: { type: Number, default: 0 },
  rewardCurrency: { type: Number, default: 0 },
  rarity: { type: String, enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'], default: 'common' }
}, { timestamps: true });

const userAchievementSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  achievementId: { type: String, required: true },
  unlockedAt: { type: Date, default: Date.now }
}, { timestamps: true });
userAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

// Daily login rewards
const dailyLoginSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  day: { type: Number, required: true }, // 1-30 cycle
  claimedAt: { type: Date, default: Date.now }
}, { timestamps: true });
dailyLoginSchema.index({ userId: 1 });

const Friend = mongoose.model('Friend', friendSchema);
const Chat = mongoose.model('Chat', chatSchema);
const Activity = mongoose.model('Activity', activitySchema);
const Challenge = mongoose.model('Challenge', challengeSchema);
const Gift = mongoose.model('Gift', giftSchema);
const Achievement = mongoose.model('Achievement', achievementSchema);
const UserAchievement = mongoose.model('UserAchievement', userAchievementSchema);
const DailyLogin = mongoose.model('DailyLogin', dailyLoginSchema);

module.exports = { Friend, Chat, Activity, Challenge, Gift, Achievement, UserAchievement, DailyLogin };
