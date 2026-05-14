const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  itemId: { type: String, required: true },
  paymentMethod: { type: String, enum: ['in_game', 'stripe', 'paypal', 'ad_reward', 'simulated', 'stripe_simulated', 'paypal_simulated', 'stripe_fallback'], required: true },
  amountPaid: { type: Number, default: 0 },
  currencyType: { type: String, enum: ['usd', 'credits', 'free'], default: 'credits' },
  status: { type: String, enum: ['completed', 'pending', 'refunded'], default: 'completed' }
}, { timestamps: true });

purchaseSchema.index({ userId: 1, createdAt: -1 });
module.exports = mongoose.model('Purchase', purchaseSchema);
