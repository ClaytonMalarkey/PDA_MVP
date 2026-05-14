const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const User = require('../models/User');
const Task = require('../models/Task');
const UserTask = require('../models/UserTask');
const Purchase = require('../models/Purchase');
const Transaction = require('../models/Transaction');
const UserStructure = require('../models/UserStructure');
const ResearchProgress = require('../models/ResearchProgress');
const ShopItem = require('../models/ShopItem');
const Node = require('../models/Node');
const Plugin = require('../models/Plugin');
const NodePlugin = require('../models/NodePlugin');
const Civilization = require('../models/Civilization');
const Guild = require('../models/Guild');
const GlobalProject = require('../models/GlobalProject');
const ActivityFeed = require('../models/ActivityFeed');
const { Chat, Challenge, Gift, Achievement, UserAchievement, DailyLogin, Friend } = require('../models/Social');

router.use(authenticate);
router.use(requireAdmin);

// === COMPREHENSIVE ANALYTICS ===
router.get('/overview', async (req, res) => {
  try {
    const now = new Date();
    const day1 = new Date(now - 86400000);
    const day7 = new Date(now - 7 * 86400000);
    const day30 = new Date(now - 30 * 86400000);

    // User stats
    const [totalUsers, activeToday, active7d, active30d, newToday, new7d, premiumUsers] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ lastActivityDate: { $gte: day1 } }),
      User.countDocuments({ lastActivityDate: { $gte: day7 } }),
      User.countDocuments({ lastActivityDate: { $gte: day30 } }),
      User.countDocuments({ createdAt: { $gte: day1 } }),
      User.countDocuments({ createdAt: { $gte: day7 } }),
      User.countDocuments({ isPremium: true }),
    ]);

    // Aggregated user stats
    const userAgg = await User.aggregate([{ $group: {
      _id: null,
      totalXP: { $sum: '$xp' }, avgXP: { $avg: '$xp' },
      totalCurrency: { $sum: '$currency' }, avgCurrency: { $avg: '$currency' },
      avgStreak: { $avg: '$streak' }, maxStreak: { $max: '$streak' },
      avgRank: { $avg: '$rank' }, maxRank: { $max: '$rank' },
      totalTasks: { $sum: '$totalTasksCompleted' },
      avgEnergy: { $avg: '$energy' },
      totalInfluence: { $sum: '$influencePoints' },
      totalInnovation: { $sum: '$innovationTokens' },
      totalLegacy: { $sum: '$legacyStones' },
      totalKnowledge: { $sum: '$knowledgePoints' },
    }}]);
    const ua = userAgg[0] || {};

    // Task stats
    const [totalTasks, completedTasks, completedToday, completed7d] = await Promise.all([
      Task.countDocuments({ isActive: true }),
      UserTask.countDocuments({ status: 'completed' }),
      UserTask.countDocuments({ status: 'completed', completedAt: { $gte: day1 } }),
      UserTask.countDocuments({ status: 'completed', completedAt: { $gte: day7 } }),
    ]);

    // Economy stats
    const [totalPurchases, purchasesToday, revenueAgg] = await Promise.all([
      Purchase.countDocuments(),
      Purchase.countDocuments({ createdAt: { $gte: day1 } }),
      Purchase.aggregate([
        { $match: { currencyType: 'usd', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amountPaid' }, count: { $sum: 1 } } }
      ]),
    ]);
    const revenue = revenueAgg[0] || { total: 0, count: 0 };

    // Social stats
    const [totalChats, totalFriends, totalChallenges, totalGifts, totalAchievements] = await Promise.all([
      Chat.countDocuments(),
      Friend.countDocuments({ status: 'accepted' }),
      Challenge.countDocuments(),
      Gift.countDocuments(),
      UserAchievement.countDocuments(),
    ]);

    // Empire stats
    const [totalStructures, totalResearch, totalCivs, totalGuilds, totalProjects] = await Promise.all([
      UserStructure.countDocuments(),
      ResearchProgress.countDocuments({ isCompleted: true }),
      Civilization.countDocuments(),
      Guild.countDocuments(),
      GlobalProject.countDocuments(),
    ]);

    // Node/Plugin stats
    const [totalNodes, onlineNodes, totalPlugins, totalInstalls] = await Promise.all([
      Node.countDocuments(),
      Node.countDocuments({ status: 'online' }),
      Plugin.countDocuments({ isPublished: true }),
      NodePlugin.countDocuments(),
    ]);

    // Shop item stats
    const topItems = await Purchase.aggregate([
      { $group: { _id: '$itemId', count: { $sum: 1 }, revenue: { $sum: '$amountPaid' } } },
      { $sort: { count: -1 } }, { $limit: 10 }
    ]);

    // Daily login stats
    const dailyLogins = await DailyLogin.countDocuments({ claimedAt: { $gte: day1 } });

    // Activity feed stats
    const activityByType = await ActivityFeed.aggregate([
      { $match: { createdAt: { $gte: day7 } } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // User level distribution
    const levelDist = await User.aggregate([
      { $bucket: { groupBy: '$rank', boundaries: [0,5,10,15,20,25,50,100], default: '100+', output: { count: { $sum: 1 } } } }
    ]);

    // Hub level distribution
    const hubDist = await User.aggregate([
      { $group: { _id: '$hubLevel', count: { $sum: 1 } } }, { $sort: { _id: 1 } }
    ]);

    // Top 10 players
    const topPlayers = await User.find().select('email xp rank currency streak totalTasksCompleted isPremium hubLevel').sort({ xp: -1 }).limit(10).lean();

    // Retention: users who logged in today vs 7 days ago
    const retention7d = totalUsers > 0 ? ((active7d / totalUsers) * 100).toFixed(1) : 0;
    const retention30d = totalUsers > 0 ? ((active30d / totalUsers) * 100).toFixed(1) : 0;

    res.json({
      users: { total: totalUsers, activeToday, active7d, active30d, newToday, new7d, premium: premiumUsers, retention7d, retention30d, dailyLogins },
      economy: {
        totalCurrency: ua.totalCurrency || 0, avgCurrency: Math.round(ua.avgCurrency || 0),
        totalRevenue: revenue.total, paidPurchases: revenue.count, totalPurchases, purchasesToday,
        totalInfluence: ua.totalInfluence || 0, totalInnovation: ua.totalInnovation || 0,
        totalLegacy: ua.totalLegacy || 0, totalKnowledge: ua.totalKnowledge || 0,
        topItems,
      },
      progression: {
        totalXP: ua.totalXP || 0, avgXP: Math.round(ua.avgXP || 0),
        avgStreak: (ua.avgStreak || 0).toFixed(1), maxStreak: ua.maxStreak || 0,
        avgRank: (ua.avgRank || 0).toFixed(1), maxRank: ua.maxRank || 0,
        totalTasksCompleted: ua.totalTasks || 0, completedToday, completed7d,
        totalTasks, avgEnergy: Math.round(ua.avgEnergy || 0),
        levelDist, hubDist,
      },
      social: { chats: totalChats, friends: totalFriends, challenges: totalChallenges, gifts: totalGifts, achievements: totalAchievements },
      empire: { structures: totalStructures, research: totalResearch, civilizations: totalCivs, guilds: totalGuilds, projects: totalProjects },
      network: { nodes: totalNodes, onlineNodes, plugins: totalPlugins, pluginInstalls: totalInstalls },
      activity: { byType: activityByType },
      topPlayers,
    });
  } catch (e) {
    console.error('Analytics error:', e);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// === PLAYER DETAIL ===
router.get('/player/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) return res.status(404).json({ error: 'Not found' });
    const [tasks, structures, research, purchases, achievements, nodes, friends] = await Promise.all([
      UserTask.countDocuments({ userId: req.params.id, status: 'completed' }),
      UserStructure.find({ userId: req.params.id }).lean(),
      ResearchProgress.countDocuments({ userId: req.params.id, isCompleted: true }),
      Purchase.find({ userId: req.params.id }).sort({ createdAt: -1 }).limit(20).lean(),
      UserAchievement.find({ userId: req.params.id }).lean(),
      Node.find({ userId: req.params.id }).lean(),
      Friend.countDocuments({ $or: [{ userId: req.params.id }, { friendId: req.params.id }], status: 'accepted' }),
    ]);
    res.json({ ...user, stats: { tasksCompleted: tasks, structures: structures.length, researchCompleted: research, purchaseCount: purchases.length, achievementCount: achievements.length, nodeCount: nodes.length, friendCount: friends }, purchases, achievements: achievements.map(a => a.achievementId), nodes });
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

module.exports = router;
