var express = require('express');
var router = express.Router();
var { authenticate } = require('../middleware/auth');
var { getAllTiers, getActiveOffers, getTournaments, getBundles, getSubscriptionTier } = require('../services/monetization');
var User = require('../models/User');
var Purchase = require('../models/Purchase');

// Get subscription tiers
router.get('/tiers', authenticate, function(req, res) { res.json(getAllTiers()); });

// Get current user's tier
router.get('/my-tier', authenticate, async function(req, res) {
  try {
    var user = await User.findById(req.userId);
    var tierId = user.isPremium ? 'pro' : 'free';
    if (user.premiumExpiresAt && new Date(user.premiumExpiresAt) > new Date()) {
      // Check which tier based on stored data
      tierId = user.subscriptionTier || 'pro';
    }
    res.json({ tier: getSubscriptionTier(tierId), tierId: tierId });
  } catch(e) { res.status(500).json({ error: 'Failed' }); }
});

// Subscribe to a tier (simulated — in production use Stripe)
router.post('/subscribe/:tierId', authenticate, async function(req, res) {
  try {
    var tier = getSubscriptionTier(req.params.tierId);
    if (!tier || tier.price === 0) return res.status(400).json({ error: 'Invalid tier' });
    var user = await User.findById(req.userId);
    user.isPremium = true;
    user.premiumExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    user.maxEnergy = tier.limits.maxEnergy;
    await user.save();
    await Purchase.create({ userId: req.userId, itemId: 'sub_' + tier.id, paymentMethod: 'stripe', amountPaid: tier.price, currencyType: 'usd' });
    res.json({ message: 'Subscribed to ' + tier.name + '!', tier: tier });
  } catch(e) { res.status(500).json({ error: 'Failed' }); }
});

// Get AI-driven offers for current user
router.get('/offers', authenticate, async function(req, res) {
  try {
    var user = await User.findById(req.userId);
    var purchaseCount = await Purchase.countDocuments({ userId: req.userId });
    var hoursSince = (Date.now() - (user.lastActivityDate ? user.lastActivityDate.getTime() : Date.now())) / 3600000;
    var daysSince = hoursSince / 24;
    var ctx = {
      tasksToday: user.dailyTasksCompleted || 0,
      streak: user.streak || 0,
      hoursSinceActivity: hoursSince,
      daysSinceLogin: daysSince,
      xpToNext: (user.rank || 1) * 100 - (user.xp || 0),
      totalPurchases: purchaseCount,
      totalTasks: user.totalTasksCompleted || 0,
      tasksLast30min: user.dailyTasksCompleted || 0, // simplified
    };
    var offers = getActiveOffers(ctx);
    res.json(offers);
  } catch(e) { res.status(500).json({ error: 'Failed' }); }
});

// Purchase a bundle
router.post('/bundle/:bundleId', authenticate, async function(req, res) {
  try {
    var bundles = getBundles();
    var bundle = bundles.find(function(b) { return b.id === req.params.bundleId; });
    if (!bundle) return res.status(404).json({ error: 'Bundle not found' });
    var user = await User.findById(req.userId);
    if (user.currency < bundle.price) return res.status(400).json({ error: 'Need ' + bundle.price + ' credits' });
    user.currency -= bundle.price;
    if (bundle.items.currency) user.currency += bundle.items.currency;
    if (bundle.items.xp) user.xp += bundle.items.xp;
    if (bundle.items.energy) user.energy = Math.min((user.energy||100) + bundle.items.energy, user.maxEnergy||200);
    if (bundle.items.legacyStones) user.legacyStones = (user.legacyStones||0) + bundle.items.legacyStones;
    if (bundle.items.influencePoints) user.influencePoints = (user.influencePoints||0) + bundle.items.influencePoints;
    if (bundle.items.knowledgePoints) user.knowledgePoints = (user.knowledgePoints||0) + bundle.items.knowledgePoints;
    await user.save();
    await Purchase.create({ userId: req.userId, itemId: 'bundle_' + bundle.id, paymentMethod: 'in_game', amountPaid: bundle.price, currencyType: 'credits' });
    res.json({ message: 'Purchased ' + bundle.name + '!', items: bundle.items });
  } catch(e) { res.status(500).json({ error: 'Failed' }); }
});

// Get tournaments
router.get('/tournaments', authenticate, function(req, res) { res.json(getTournaments()); });

// Get bundles
router.get('/bundles', authenticate, function(req, res) { res.json(getBundles()); });

module.exports = router;
