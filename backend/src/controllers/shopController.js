const ShopItem = require('../models/ShopItem');
const Purchase = require('../models/Purchase');
const User = require('../models/User');

const getShopItems = async (req, res) => {
  try {
    const items = await ShopItem.find({ isActive: true }).sort({ category: 1, sortOrder: 1 });
    const purchases = await Purchase.find({ userId: req.userId }).lean();
    const purchaseCounts = {};
    purchases.forEach(p => { purchaseCounts[p.itemId] = (purchaseCounts[p.itemId] || 0) + 1; });

    const result = items.map(item => ({
      ...item.toObject(),
      timesPurchased: purchaseCounts[item.itemId] || 0,
      canPurchase: item.purchaseLimit === 0 || (purchaseCounts[item.itemId] || 0) < item.purchaseLimit
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch shop items' });
  }
};

// Purchase with in-game currency
const purchaseWithCurrency = async (req, res) => {
  try {
    const { itemId } = req.params;
    const user = await User.findById(req.userId);
    const item = await ShopItem.findOne({ itemId, isActive: true });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.priceCurrency <= 0) return res.status(400).json({ error: 'This item requires real money' });

    // Check purchase limit
    if (item.purchaseLimit > 0) {
      const count = await Purchase.countDocuments({ userId: req.userId, itemId });
      if (count >= item.purchaseLimit) return res.status(400).json({ error: 'Purchase limit reached' });
    }

    if (user.currency < item.priceCurrency) return res.status(400).json({ error: 'Not enough credits' });

    user.currency -= item.priceCurrency;
    applyRewards(user, item.rewards);
    await user.save();

    await Purchase.create({ userId: req.userId, itemId, paymentMethod: 'in_game', amountPaid: item.priceCurrency, currencyType: 'credits' });

    res.json({ message: `Purchased ${item.name}!`, user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ error: 'Purchase failed' });
  }
};

// Simulate Stripe purchase (in production, use real Stripe webhook)
const purchaseWithStripe = async (req, res) => {
  try {
    const { itemId } = req.params;
    const user = await User.findById(req.userId);
    const item = await ShopItem.findOne({ itemId, isActive: true });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.priceUSD <= 0) return res.status(400).json({ error: 'Item has no USD price' });

    if (item.purchaseLimit > 0) {
      const count = await Purchase.countDocuments({ userId: req.userId, itemId });
      if (count >= item.purchaseLimit) return res.status(400).json({ error: 'Purchase limit reached' });
    }

    // In production: create Stripe checkout session and handle via webhook
    // For now: simulate successful payment
    applyRewards(user, item.rewards);
    await user.save();

    await Purchase.create({ userId: req.userId, itemId, paymentMethod: 'stripe', amountPaid: item.priceUSD, currencyType: 'usd' });

    res.json({ message: `Purchased ${item.name}!`, user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ error: 'Purchase failed' });
  }
};

// Rewarded ad — give free reward
const claimAdReward = async (req, res) => {
  try {
    const { rewardType } = req.body; // 'currency', 'energy', 'xp_boost'
    const user = await User.findById(req.userId);

    // Check cooldown (1 ad per 5 minutes)
    const lastAd = await Purchase.findOne({ userId: req.userId, paymentMethod: 'ad_reward' }).sort({ createdAt: -1 });
    if (lastAd && Date.now() - lastAd.createdAt.getTime() < 5 * 60 * 1000) {
      const wait = Math.ceil((5 * 60 * 1000 - (Date.now() - lastAd.createdAt.getTime())) / 1000);
      return res.status(429).json({ error: `Wait ${wait}s for next ad reward` });
    }

    let reward = {};
    switch (rewardType) {
      case 'currency': user.currency += 50; reward = { currency: 50 }; break;
      case 'energy': user.energy = Math.min(user.energy + 30, user.maxEnergy); reward = { energy: 30 }; break;
      case 'xp_boost': user.xp += 100; reward = { xp: 100 }; break;
      default: return res.status(400).json({ error: 'Invalid reward type' });
    }
    await user.save();

    await Purchase.create({ userId: req.userId, itemId: `ad_${rewardType}`, paymentMethod: 'ad_reward', amountPaid: 0, currencyType: 'free' });

    res.json({ message: 'Ad reward claimed!', reward, user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to claim reward' });
  }
};

// Get purchase history
const getPurchaseHistory = async (req, res) => {
  try {
    const purchases = await Purchase.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(50);
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};

function applyRewards(user, rewards) {
  if (rewards.currency) user.currency += rewards.currency;
  if (rewards.xp) user.xp += rewards.xp;
  if (rewards.energy) user.energy = Math.min(user.energy + rewards.energy, user.maxEnergy);
  if (rewards.influencePoints) user.influencePoints += rewards.influencePoints;
  if (rewards.innovationTokens) user.innovationTokens += rewards.innovationTokens;
  if (rewards.legacyStones) user.legacyStones += rewards.legacyStones;
  if (rewards.premiumDays) {
    const now = new Date();
    const current = user.premiumExpiresAt && user.premiumExpiresAt > now ? user.premiumExpiresAt : now;
    user.isPremium = true;
    user.premiumExpiresAt = new Date(current.getTime() + rewards.premiumDays * 24 * 60 * 60 * 1000);
  }
}

function sanitizeUser(user) {
  return { currency: user.currency, xp: user.xp, energy: user.energy, maxEnergy: user.maxEnergy,
    influencePoints: user.influencePoints, innovationTokens: user.innovationTokens, legacyStones: user.legacyStones,
    isPremium: user.isPremium, premiumExpiresAt: user.premiumExpiresAt };
}

module.exports = { getShopItems, purchaseWithCurrency, purchaseWithStripe, claimAdReward, getPurchaseHistory };
