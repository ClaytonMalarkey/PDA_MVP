const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const sc = require('../controllers/socialController');
const User = require('../models/User');

router.get('/daily-login', authenticate, sc.getDailyLoginStatus);
router.post('/daily-login', authenticate, sc.claimDailyLogin);
router.get('/feed', authenticate, sc.getActivityFeed);
router.get('/friends', authenticate, sc.getFriends);
router.post('/friends', authenticate, sc.sendFriendRequest);
router.post('/friends/:requestId/accept', authenticate, sc.acceptFriend);
router.get('/chat', authenticate, sc.getGlobalChat);
router.post('/chat', authenticate, sc.sendChat);
router.get('/challenges', authenticate, sc.getMyChallenges);
router.post('/challenges', authenticate, sc.createChallenge);
router.post('/challenges/:id/respond', authenticate, sc.respondChallenge);
router.post('/gifts', authenticate, sc.sendGift);
router.get('/gifts', authenticate, sc.getMyGifts);
router.post('/gifts/:id/claim', authenticate, sc.claimGift);
router.get('/achievements', authenticate, sc.getAchievements);

// Loot box / mystery reward
router.post('/loot-box', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const cost = 100;
    if (user.currency < cost) return res.status(400).json({ error: 'Need 100 credits' });

    user.currency -= cost;

    // Random loot table
    const roll = Math.random();
    let reward = {};
    if (roll < 0.30) { reward = { type: 'credits', amount: 50 + Math.floor(Math.random() * 100), rarity: 'common' }; user.currency += reward.amount; }
    else if (roll < 0.55) { reward = { type: 'xp', amount: 100 + Math.floor(Math.random() * 200), rarity: 'common' }; user.xp += reward.amount; }
    else if (roll < 0.70) { reward = { type: 'energy', amount: 30 + Math.floor(Math.random() * 50), rarity: 'uncommon' }; user.energy = Math.min((user.energy || 100) + reward.amount, user.maxEnergy || 200); }
    else if (roll < 0.82) { reward = { type: 'credits', amount: 200 + Math.floor(Math.random() * 300), rarity: 'uncommon' }; user.currency += reward.amount; }
    else if (roll < 0.90) { reward = { type: 'influence', amount: 10 + Math.floor(Math.random() * 20), rarity: 'rare' }; user.influencePoints = (user.influencePoints || 0) + reward.amount; }
    else if (roll < 0.96) { reward = { type: 'innovation', amount: 5 + Math.floor(Math.random() * 15), rarity: 'rare' }; user.innovationTokens = (user.innovationTokens || 0) + reward.amount; }
    else if (roll < 0.99) { reward = { type: 'credits', amount: 500 + Math.floor(Math.random() * 500), rarity: 'epic' }; user.currency += reward.amount; }
    else { reward = { type: 'legacy', amount: 3 + Math.floor(Math.random() * 5), rarity: 'legendary' }; user.legacyStones = (user.legacyStones || 0) + reward.amount; }

    await user.save();
    res.json({ reward, message: `${reward.rarity.toUpperCase()}! +${reward.amount} ${reward.type}` });
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

module.exports = router;
