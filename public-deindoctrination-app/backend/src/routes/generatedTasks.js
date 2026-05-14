const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  generateRandomBatch, generateByDomain, getDomainInfo, getTotalTaskCount,
  generatePersonalizedBatch, generateDailyQuests, generateWeeklyChallenge
} = require('../services/taskGenerator');
const { verifyTaskCompletion } = require('../services/aiVerifier');
const { getTaskHelp } = require('../services/taskHelper');
const { rollRareDrops } = require('../services/variableRewards');
const { detectArchetype, getArchetypeMultipliers } = require('../services/archetypeSystem');
const { emitToUser, emitActivity, getIO } = require('../services/socketManager');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Get total count
router.get('/count', authenticate, (req, res) => {
  res.json({ total: getTotalTaskCount(), domains: getDomainInfo() });
});

// Get random generated tasks
router.get('/random', authenticate, (req, res) => {
  const count = Math.min(parseInt(req.query.count) || 30, 100);
  const tasks = generateRandomBatch(count);
  res.json(tasks);
});

// Get tasks by domain
router.get('/domain/:domain', authenticate, (req, res) => {
  const count = Math.min(parseInt(req.query.count) || 20, 50);
  const tasks = generateByDomain(req.params.domain, count);
  res.json(tasks);
});

// Get domain info
router.get('/domains', authenticate, (req, res) => {
  res.json(getDomainInfo());
});

// === PERSONALIZED TASKS — tailored to player level/history ===
router.get('/personalized', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('rank xp streak dominantDomain totalTasksCompleted');
    const count = Math.min(parseInt(req.query.count) || 20, 50);
    const tasks = generatePersonalizedBatch({
      level: user?.rank || 1,
      dominantDomain: user?.dominantDomain || null,
      streak: user?.streak || 0,
      totalTasksCompleted: user?.totalTasksCompleted || 0
    }, count);
    res.json(tasks);
  } catch (error) {
    console.error('Personalized tasks error:', error);
    res.json(generateRandomBatch(20)); // fallback
  }
});

// === DAILY QUESTS — 3 quests that reset every 24h ===
router.get('/daily', authenticate, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const quests = generateDailyQuests(req.userId.toString(), today);
    res.json(quests);
  } catch (error) {
    console.error('Daily quests error:', error);
    res.status(500).json({ error: 'Failed to generate daily quests' });
  }
});

// === WEEKLY CHALLENGE ===
router.get('/weekly', authenticate, async (req, res) => {
  try {
    const challenge = generateWeeklyChallenge(req.userId.toString());
    res.json(challenge);
  } catch (error) {
    console.error('Weekly challenge error:', error);
    res.status(500).json({ error: 'Failed to generate weekly challenge' });
  }
});

// Get help/hints for a task category
router.get('/help/:category', authenticate, (req, res) => {
  const help = getTaskHelp(decodeURIComponent(req.params.category));
  res.json(help);
});

// Complete a generated task (with optional AI verification)
router.post('/complete/:taskId', authenticate, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { xpReward, currencyReward, category, title, proof, tier } = req.body;
    const user = await User.findById(req.userId);

    // AI Verification if proof provided
    let aiResult = null;
    let verificationBonus = 1;
    if (proof && proof.trim().length > 0) {
      aiResult = verifyTaskCompletion({ title, category }, proof);
      if (aiResult.verified) {
        verificationBonus = aiResult.multiplier; // 1.0 to 1.5x
      }
    }

    const xp = Math.min(xpReward || 30, 1500);
    const currency = Math.min(currencyReward || 15, 750);
    const streakMul = Math.min(1 + (user.streak * 0.02), 1.5);

    // Archetype bonus
    const arch = detectArchetype(user);
    const archMul = getArchetypeMultipliers(arch.primary);

    // Combo multiplier
    const timeSinceLast = Date.now() - (user.lastActivityDate?.getTime() || 0);
    const comboMul = timeSinceLast < 120000 ? 1.25 : timeSinceLast < 300000 ? 1.1 : 1;

    const finalXP = Math.floor(xp * streakMul * (user.globalMultiplier || 1) * verificationBonus * comboMul * archMul.xp);
    const finalCurrency = Math.floor(currency * streakMul * verificationBonus * comboMul * archMul.currency);

    // Bonus influence points for verified tasks
    const ipBonus = aiResult?.verified ? Math.floor(finalXP * 0.05) : 0;

    user.xp += finalXP;
    user.currency += finalCurrency;
    user.influencePoints = (user.influencePoints || 0) + ipBonus;
    user.totalTasksCompleted = (user.totalTasksCompleted || 0) + 1;
    user.dailyTasksCompleted = (user.dailyTasksCompleted || 0) + 1;

    const hoursSince = (Date.now() - (user.lastActivityDate?.getTime() || 0)) / (1000 * 60 * 60);
    if (hoursSince <= 24) user.streak = (user.streak || 0) + 1;
    else if (hoursSince > 48) user.streak = 1;
    user.lastActivityDate = new Date();
    if (category) user.dominantDomain = category;
    await user.save();

    await Transaction.create({
      userId: req.userId, type: 'task_reward', amount: finalXP, currency: 'xp',
      metadata: { taskId, category, generated: true, aiVerified: aiResult?.verified || false, aiScore: aiResult?.score || 0 }
    });

    // Roll for rare drops
    const drops = rollRareDrops(tier || 'Small', user.streak || 0);
    for (const d of drops) {
      if (d.bonus.currency) user.currency += d.bonus.currency;
      if (d.bonus.xp) user.xp += d.bonus.xp;
      if (d.bonus.legacyStones) user.legacyStones = (user.legacyStones||0) + d.bonus.legacyStones;
      if (d.bonus.knowledgePoints) user.knowledgePoints = (user.knowledgePoints||0) + d.bonus.knowledgePoints;
      if (d.bonus.influencePoints) user.influencePoints = (user.influencePoints||0) + d.bonus.influencePoints;
      if (d.bonus.innovationTokens) user.innovationTokens = (user.innovationTokens||0) + d.bonus.innovationTokens;
    }
    if (drops.length > 0) await user.save();

    // === EMIT WORLD EVENTS (visible to nearby players) ===
    const io = getIO();
    if (io) {
      // Broadcast task completion to all players (activity feed)
      emitActivity({
        type: 'task_complete',
        userId: req.userId,
        email: user.email,
        message: `${user.email?.split('@')[0] || 'A player'} completed "${title?.substring(0, 40) || 'a task'}" +${finalXP}XP`,
        xp: finalXP,
        category,
        aiVerified: aiResult?.verified || false,
        timestamp: new Date().toISOString()
      });

      // Send personal reward notification
      emitToUser(req.userId.toString(), 'reward:earned', {
        type: 'task',
        xp: finalXP,
        currency: finalCurrency,
        aiVerified: aiResult?.verified,
        aiScore: aiResult?.score,
        rareDrops: drops,
        message: aiResult?.verified ? `🤖 AI Verified! +${finalXP}XP` : `✅ Task done! +${finalXP}XP`
      });

      // Contribute to world civilization level
      const socket = require('../services/socketManager');
      const userSocket = socket.getIO();
      if (userSocket) {
        // Emit world contribution event via the socket
        const worldContrib = require('../services/worldManager');
        const result = worldContrib.contributeToWorld(req.userId.toString(), 'task', Math.floor(finalXP / 10));
        if (result.levelUp) {
          userSocket.emit('world:levelup', { level: result.newLevel });
          userSocket.emit('world:event', {
            id: 'civ_levelup',
            name: `🏆 Civilization Level ${result.newLevel}!`,
            description: 'The collective effort of all players has advanced civilization!',
            duration: 30000
          });
        }
      }
    }

    res.json({
      message: aiResult?.verified ? '✅ AI Verified! Bonus rewards!' : 'Task completed!',
      rewards: { xp: finalXP, currency: finalCurrency, ip: ipBonus },
      combo: comboMul > 1 ? comboMul + 'x combo!' : null,
      archetype: arch.primary,
      rareDrops: drops,
      aiVerification: aiResult,
      user: { xp: user.xp, currency: user.currency, streak: user.streak, influencePoints: user.influencePoints }
    });
  } catch (error) {
    console.error('Complete generated task error:', error);
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

module.exports = router;


// Get total count
router.get('/count', authenticate, (req, res) => {
  res.json({ total: getTotalTaskCount(), domains: getDomainInfo() });
});

// Get random generated tasks
router.get('/random', authenticate, (req, res) => {
  const count = Math.min(parseInt(req.query.count) || 30, 100);
  const tasks = generateRandomBatch(count);
  res.json(tasks);
});

// Get tasks by domain
router.get('/domain/:domain', authenticate, (req, res) => {
  const count = Math.min(parseInt(req.query.count) || 20, 50);
  const tasks = generateByDomain(req.params.domain, count);
  res.json(tasks);
});

// Get domain info
router.get('/domains', authenticate, (req, res) => {
  res.json(getDomainInfo());
});

// Get help/hints for a task category
router.get('/help/:category', authenticate, (req, res) => {
  const help = getTaskHelp(decodeURIComponent(req.params.category));
  res.json(help);
});

// Complete a generated task (with optional AI verification)
router.post('/complete/:taskId', authenticate, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { xpReward, currencyReward, category, title, proof } = req.body;
    const user = await User.findById(req.userId);

    // AI Verification if proof provided
    let aiResult = null;
    let verificationBonus = 1;
    if (proof && proof.trim().length > 0) {
      aiResult = verifyTaskCompletion({ title, category }, proof);
      if (aiResult.verified) {
        verificationBonus = aiResult.multiplier; // 1.0 to 1.5x
      }
    }

    const xp = Math.min(xpReward || 30, 1500);
    const currency = Math.min(currencyReward || 15, 750);
    const streakMul = Math.min(1 + (user.streak * 0.02), 1.5);

    // Archetype bonus
    const arch = detectArchetype(user);
    const archMul = getArchetypeMultipliers(arch.primary);

    // Combo multiplier
    const timeSinceLast = Date.now() - (user.lastActivityDate?.getTime() || 0);
    const comboMul = timeSinceLast < 120000 ? 1.25 : timeSinceLast < 300000 ? 1.1 : 1;

    const finalXP = Math.floor(xp * streakMul * user.globalMultiplier * verificationBonus * comboMul * archMul.xp);
    const finalCurrency = Math.floor(currency * streakMul * verificationBonus * comboMul * archMul.currency);

    // Bonus influence points for verified tasks
    const ipBonus = aiResult?.verified ? Math.floor(finalXP * 0.05) : 0;

    user.xp += finalXP;
    user.currency += finalCurrency;
    user.influencePoints = (user.influencePoints || 0) + ipBonus;
    user.totalTasksCompleted = (user.totalTasksCompleted || 0) + 1;
    user.dailyTasksCompleted = (user.dailyTasksCompleted || 0) + 1;

    const hoursSince = (Date.now() - (user.lastActivityDate?.getTime() || 0)) / (1000 * 60 * 60);
    if (hoursSince <= 24) user.streak = (user.streak || 0) + 1;
    else if (hoursSince > 48) user.streak = 1;
    user.lastActivityDate = new Date();
    if (category) user.dominantDomain = category;
    await user.save();

    await Transaction.create({
      userId: req.userId, type: 'task_reward', amount: finalXP, currency: 'xp',
      metadata: { taskId, category, generated: true, aiVerified: aiResult?.verified || false, aiScore: aiResult?.score || 0 }
    });

    // Roll for rare drops
    const drops = rollRareDrops(req.body.tier || 'Small', user.streak || 0);
    for (const d of drops) {
      if (d.bonus.currency) user.currency += d.bonus.currency;
      if (d.bonus.xp) user.xp += d.bonus.xp;
      if (d.bonus.legacyStones) user.legacyStones = (user.legacyStones||0) + d.bonus.legacyStones;
      if (d.bonus.knowledgePoints) user.knowledgePoints = (user.knowledgePoints||0) + d.bonus.knowledgePoints;
      if (d.bonus.influencePoints) user.influencePoints = (user.influencePoints||0) + d.bonus.influencePoints;
      if (d.bonus.innovationTokens) user.innovationTokens = (user.innovationTokens||0) + d.bonus.innovationTokens;
    }
    if (drops.length > 0) await user.save();

    res.json({
      message: aiResult?.verified ? '✅ AI Verified! Bonus rewards!' : 'Task completed!',
      rewards: { xp: finalXP, currency: finalCurrency, ip: ipBonus },
      combo: comboMul > 1 ? comboMul + 'x combo!' : null,
      archetype: arch.primary,
      rareDrops: drops,
      aiVerification: aiResult,
      user: { xp: user.xp, currency: user.currency, streak: user.streak, influencePoints: user.influencePoints }
    });
  } catch (error) {
    console.error('Complete generated task error:', error);
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

module.exports = router;
