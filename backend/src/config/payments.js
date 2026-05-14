/**
 * Payment Configuration — Stripe + PayPal
 * 
 * SETUP GUIDE:
 * 
 * === STRIPE ===
 * 1. Go to https://dashboard.stripe.com/register
 * 2. Get your API keys from https://dashboard.stripe.com/apikeys
 * 3. Copy the Secret Key (starts with sk_test_ or sk_live_)
 * 4. For webhooks: https://dashboard.stripe.com/webhooks
 *    - Add endpoint: https://yourdomain.com/api/checkout/webhook
 *    - Select events: checkout.session.completed
 *    - Copy the Signing Secret (starts with whsec_)
 * 5. Add to .env:
 *    STRIPE_SECRET_KEY=sk_test_your_key_here
 *    STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
 * 
 * === PAYPAL ===
 * 1. Go to https://developer.paypal.com/dashboard/applications/sandbox
 * 2. Create a new app (or use Default Application)
 * 3. Copy Client ID and Secret
 * 4. For production: switch to Live credentials
 * 5. Add to .env:
 *    PAYPAL_CLIENT_ID=your_client_id_here
 *    PAYPAL_CLIENT_SECRET=your_secret_here
 *    PAYPAL_MODE=sandbox   (change to 'live' for production)
 */

// === STRIPE CONFIG ===
var stripeInstance = null;
var stripeConfigured = false;

function getStripe() {
  if (stripeInstance) return stripeInstance;
  var key = process.env.STRIPE_SECRET_KEY;
  if (key && key !== 'sk_test_placeholder' && key.startsWith('sk_')) {
    stripeInstance = require('stripe')(key);
    stripeConfigured = true;
    console.log('✅ Stripe configured (' + (key.startsWith('sk_live') ? 'LIVE' : 'TEST') + ' mode)');
  } else {
    console.log('⚠️  Stripe not configured — purchases will be simulated');
  }
  return stripeInstance;
}

function isStripeConfigured() { return stripeConfigured; }

// === PAYPAL CONFIG ===
var paypalClient = null;
var paypalConfigured = false;

function getPayPal() {
  if (paypalClient) return paypalClient;
  var clientId = process.env.PAYPAL_CLIENT_ID;
  var secret = process.env.PAYPAL_CLIENT_SECRET;
  var mode = process.env.PAYPAL_MODE || 'sandbox';

  if (clientId && secret && clientId !== 'your_client_id_here') {
    var paypal = require('@paypal/checkout-server-sdk');
    var environment = mode === 'live'
      ? new paypal.core.LiveEnvironment(clientId, secret)
      : new paypal.core.SandboxEnvironment(clientId, secret);
    paypalClient = new paypal.core.PayPalHttpClient(environment);
    paypalConfigured = true;
    console.log('✅ PayPal configured (' + mode.toUpperCase() + ' mode)');
  } else {
    console.log('⚠️  PayPal not configured — PayPal purchases will be simulated');
  }
  return paypalClient;
}

function isPayPalConfigured() { return paypalConfigured; }

// === PRODUCT CATALOG (shared between Stripe and PayPal) ===
// IDs MUST match ShopItem.itemId in MongoDB (seeded by seedShop.js)
var PRODUCTS = {
  'credits-500':  { name:'Starter Pack (500 Credits)',     priceUSD:0.99,  credits:500 },
  'credits-2500': { name:'Explorer Pack (2,500 Credits)',  priceUSD:4.99,  credits:2500, bonusXP:50 },
  'credits-7500': { name:'Commander Pack (7,500 Credits)', priceUSD:9.99,  credits:7500, bonusXP:200 },
  'credits-20000':{ name:'Emperor Pack (20,000 Credits)',  priceUSD:19.99, credits:20000, bonusXP:500 },
  'energy-mega':  { name:'Reactor Core (Full Energy)',     priceUSD:0.99,  energy:999 },
  'premium-7':    { name:'Premium Week',                   priceUSD:1.99,  premiumDays:7 },
  'premium-30':   { name:'Premium Month',                  priceUSD:4.99,  premiumDays:30 },
  'premium-365':  { name:'Premium Year + 5000 Credits',    priceUSD:39.99, premiumDays:365, bonusCredits:5000 },
};

function getProduct(itemId) { return PRODUCTS[itemId] || null; }
function getAllProducts() { return PRODUCTS; }

// === APPLY PURCHASE TO USER ===
var User = require('../models/User');
var Purchase = require('../models/Purchase');

async function applyPurchase(userId, itemId, paymentMethod) {
  var product = PRODUCTS[itemId];
  if (!product) throw new Error('Unknown product: ' + itemId);

  var user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  if (product.credits) user.currency = (user.currency || 0) + product.credits;
  if (product.bonusCredits) user.currency = (user.currency || 0) + product.bonusCredits;
  if (product.bonusXP) user.xp = (user.xp || 0) + product.bonusXP;
  if (product.energy) user.energy = Math.min((user.energy || 0) + product.energy, user.maxEnergy || 100);
  if (product.energyMaxUp) user.maxEnergy = (user.maxEnergy || 100) + product.energyMaxUp;
  if (product.premiumDays) {
    user.isPremium = true;
    var now = new Date();
    var current = user.premiumExpiresAt && user.premiumExpiresAt > now ? user.premiumExpiresAt : now;
    user.premiumExpiresAt = new Date(current.getTime() + product.premiumDays * 86400000);
  }
  await user.save();

  await Purchase.create({
    userId: userId,
    itemId: itemId,
    paymentMethod: paymentMethod,
    amountPaid: product.priceUSD,
    currencyType: 'usd',
    status: 'completed'
  });

  return { user: user, product: product };
}

module.exports = {
  getStripe: getStripe, isStripeConfigured: isStripeConfigured,
  getPayPal: getPayPal, isPayPalConfigured: isPayPalConfigured,
  getProduct: getProduct, getAllProducts: getAllProducts,
  applyPurchase: applyPurchase, PRODUCTS: PRODUCTS
};
