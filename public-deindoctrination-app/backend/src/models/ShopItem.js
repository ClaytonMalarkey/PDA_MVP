const mongoose = require('mongoose');

const shopItemSchema = new mongoose.Schema({
  itemId: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, default: '🛒' },
  category: { type: String, enum: ['currency_pack', 'premium', 'booster', 'cosmetic', 'energy'], required: true },
  priceUSD: { type: Number, default: 0 },
  priceCurrency: { type: Number, default: 0 }, // in-game currency price (0 = real money only)
  rewards: {
    currency: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    energy: { type: Number, default: 0 },
    influencePoints: { type: Number, default: 0 },
    innovationTokens: { type: Number, default: 0 },
    legacyStones: { type: Number, default: 0 },
    premiumDays: { type: Number, default: 0 },
    boostType: { type: String, default: null },
    boostDuration: { type: Number, default: 0 },
    shipColorId: { type: String, default: null }
  },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
  purchaseLimit: { type: Number, default: 0 } // 0 = unlimited
}, { timestamps: true });

shopItemSchema.index({ category: 1, isActive: 1 });
module.exports = mongoose.model('ShopItem', shopItemSchema);
