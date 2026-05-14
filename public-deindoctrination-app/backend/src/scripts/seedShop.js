#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const ShopItem = require('../models/ShopItem');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  await ShopItem.deleteMany({});

  const items = [
    // === CURRENCY PACKS (Real Money) ===
    { itemId: 'credits-500', name: 'Starter Pack', description: '500 credits to get going', icon: '💰', category: 'currency_pack',
      priceUSD: 0.99, rewards: { currency: 500 }, sortOrder: 1 },
    { itemId: 'credits-2500', name: 'Explorer Pack', description: '2,500 credits + 50 XP bonus', icon: '💎', category: 'currency_pack',
      priceUSD: 4.99, rewards: { currency: 2500, xp: 50 }, sortOrder: 2, isFeatured: true },
    { itemId: 'credits-7500', name: 'Commander Pack', description: '7,500 credits + 200 XP + 10 IP', icon: '👑', category: 'currency_pack',
      priceUSD: 9.99, rewards: { currency: 7500, xp: 200, influencePoints: 10 }, sortOrder: 3 },
    { itemId: 'credits-20000', name: 'Emperor Pack', description: '20,000 credits + 500 XP + 25 IP + 5 LS', icon: '🏆', category: 'currency_pack',
      priceUSD: 19.99, rewards: { currency: 20000, xp: 500, influencePoints: 25, legacyStones: 5 }, sortOrder: 4 },

    // === PREMIUM SUBSCRIPTION ===
    { itemId: 'premium-7', name: 'Premium Week', description: '7 days: No ads, 1.5x rewards, 24h idle cap', icon: '⭐', category: 'premium',
      priceUSD: 1.99, rewards: { premiumDays: 7 }, sortOrder: 1 },
    { itemId: 'premium-30', name: 'Premium Month', description: '30 days premium — best value', icon: '🌟', category: 'premium',
      priceUSD: 4.99, rewards: { premiumDays: 30 }, sortOrder: 2, isFeatured: true },
    { itemId: 'premium-365', name: 'Premium Year', description: '365 days premium + 5000 credits bonus', icon: '💫', category: 'premium',
      priceUSD: 39.99, rewards: { premiumDays: 365, currency: 5000 }, sortOrder: 3 },

    // === BOOSTERS (In-Game Currency) ===
    { itemId: 'boost-xp', name: 'XP Surge', description: '+500 XP instantly', icon: '⚡', category: 'booster',
      priceCurrency: 200, rewards: { xp: 500 }, sortOrder: 1 },
    { itemId: 'boost-energy', name: 'Energy Recharge', description: 'Full energy refill', icon: '🔋', category: 'booster',
      priceCurrency: 100, rewards: { energy: 500 }, sortOrder: 2 },
    { itemId: 'boost-ip', name: 'Influence Boost', description: '+25 Influence Points', icon: '📢', category: 'booster',
      priceCurrency: 300, rewards: { influencePoints: 25 }, sortOrder: 3 },
    { itemId: 'boost-it', name: 'Innovation Surge', description: '+15 Innovation Tokens', icon: '🔬', category: 'booster',
      priceCurrency: 250, rewards: { innovationTokens: 15 }, sortOrder: 4 },
    { itemId: 'boost-ls', name: 'Legacy Stone', description: '+5 Legacy Stones', icon: '🏛️', category: 'booster',
      priceCurrency: 500, rewards: { legacyStones: 5 }, sortOrder: 5 },

    // === ENERGY PACKS ===
    { itemId: 'energy-small', name: 'Small Battery', description: '+50 energy', icon: '🔋', category: 'energy',
      priceCurrency: 50, rewards: { energy: 50 }, sortOrder: 1 },
    { itemId: 'energy-large', name: 'Power Cell', description: '+150 energy', icon: '⚡', category: 'energy',
      priceCurrency: 120, rewards: { energy: 150 }, sortOrder: 2 },
    { itemId: 'energy-mega', name: 'Reactor Core', description: 'Full energy + max energy +25', icon: '☢️', category: 'energy',
      priceUSD: 0.99, rewards: { energy: 999 }, sortOrder: 3 },
  ];

  await ShopItem.insertMany(items);
  console.log(`✅ Seeded ${items.length} shop items`);
  await mongoose.connection.close();
  process.exit(0);
}
seed().catch(e => { console.error(e); process.exit(1); });
