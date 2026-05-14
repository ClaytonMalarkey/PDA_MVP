var express = require('express');
var router = express.Router();
var { authenticate } = require('../middleware/auth');
var { detectArchetype, getAllArchetypes, getArchetypeMultipliers } = require('../services/archetypeSystem');
var { rollRareDrops, generateMysteryReward, getAnticipationData } = require('../services/variableRewards');
var User = require('../models/User');

// Get all archetypes
router.get('/archetypes', authenticate, function(req, res) {
  res.json(getAllArchetypes());
});

// Detect user's archetype
router.get('/my-archetype', authenticate, async function(req, res) {
  try {
    var user = await User.findById(req.userId);
    var result = detectArchetype(user);
    res.json(result);
  } catch(e) { res.status(500).json({ error: 'Failed' }); }
});

// Get archetype multipliers
router.get('/multipliers/:archetypeId', authenticate, function(req, res) {
  res.json(getArchetypeMultipliers(req.params.archetypeId));
});

// Roll for rare drops (called after task completion)
router.post('/roll-drops', authenticate, async function(req, res) {
  try {
    var { tier } = req.body;
    var user = await User.findById(req.userId);
    var drops = rollRareDrops(tier || 'Small', user.streak || 0);

    // Apply drop bonuses to user
    for (var i = 0; i < drops.length; i++) {
      var d = drops[i];
      if (d.bonus.currency) user.currency = (user.currency||0) + d.bonus.currency;
      if (d.bonus.xp) user.xp = (user.xp||0) + d.bonus.xp;
      if (d.bonus.energy) user.energy = Math.min((user.energy||100) + d.bonus.energy, user.maxEnergy||200);
      if (d.bonus.knowledgePoints) user.knowledgePoints = (user.knowledgePoints||0) + d.bonus.knowledgePoints;
      if (d.bonus.influencePoints) user.influencePoints = (user.influencePoints||0) + d.bonus.influencePoints;
      if (d.bonus.innovationTokens) user.innovationTokens = (user.innovationTokens||0) + d.bonus.innovationTokens;
      if (d.bonus.legacyStones) user.legacyStones = (user.legacyStones||0) + d.bonus.legacyStones;
    }
    if (drops.length > 0) await user.save();

    res.json({ drops: drops, count: drops.length });
  } catch(e) { res.status(500).json({ error: 'Failed' }); }
});

// Get mystery reward
router.post('/mystery-reward', authenticate, async function(req, res) {
  try {
    var reward = generateMysteryReward();
    var user = await User.findById(req.userId);
    if (reward.type === 'currency') user.currency = (user.currency||0) + reward.amount;
    else if (reward.type === 'xp') user.xp = (user.xp||0) + reward.amount;
    else if (reward.type === 'energy') user.energy = Math.min((user.energy||100) + reward.amount, user.maxEnergy||200);
    else if (reward.type === 'influencePoints') user.influencePoints = (user.influencePoints||0) + reward.amount;
    else if (reward.type === 'innovationTokens') user.innovationTokens = (user.innovationTokens||0) + reward.amount;
    else if (reward.type === 'legacyStones') user.legacyStones = (user.legacyStones||0) + reward.amount;
    await user.save();
    res.json({ reward: reward });
  } catch(e) { res.status(500).json({ error: 'Failed' }); }
});

// Get anticipation data (almost-unlocked items)
router.get('/anticipation', authenticate, async function(req, res) {
  try {
    var user = await User.findById(req.userId);
    res.json(getAnticipationData(user));
  } catch(e) { res.status(500).json({ error: 'Failed' }); }
});

module.exports = router;
