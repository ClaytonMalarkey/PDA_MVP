var express = require('express');
var router = express.Router();
var { authenticate } = require('../middleware/auth');
var payments = require('../config/payments');

// Initialize payment providers on first request
var stripeReady = false;
var paypalReady = false;

function init() {
  if (!stripeReady) { payments.getStripe(); stripeReady = true; }
  if (!paypalReady) { payments.getPayPal(); paypalReady = true; }
}

// === GET AVAILABLE PAYMENT METHODS ===
router.get('/methods', authenticate, function(req, res) {
  init();
  res.json({
    stripe: payments.isStripeConfigured(),
    paypal: payments.isPayPalConfigured(),
    simulated: !payments.isStripeConfigured() && !payments.isPayPalConfigured(),
    products: Object.entries(payments.getAllProducts()).map(function(e) {
      return { id: e[0], name: e[1].name, priceUSD: e[1].priceUSD, credits: e[1].credits || 0, premiumDays: e[1].premiumDays || 0 };
    })
  });
});

// === STRIPE CHECKOUT ===
router.post('/stripe/:itemId', authenticate, async function(req, res) {
  try {
    init();
    var product = payments.getProduct(req.params.itemId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    var stripe = payments.getStripe();
    if (!stripe) {
      // Simulate purchase
      var result = await payments.applyPurchase(req.userId, req.params.itemId, 'stripe_simulated');
      return res.json({ mode: 'simulated', message: 'Purchase successful! ' + product.name + ' added.', product: product });
    }

    // Real Stripe Checkout Session
    var session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: product.name, description: 'Space Out — ' + product.name },
          unit_amount: Math.round(product.priceUSD * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: (process.env.FRONTEND_URL || '46.224.104.227:5173') + '?purchase=success&item=' + req.params.itemId,
      cancel_url: (process.env.FRONTEND_URL || '46.224.104.227:5173') + '?purchase=cancelled',
      metadata: { userId: req.userId.toString(), itemId: req.params.itemId },
    });

    res.json({ mode: 'stripe', url: session.url, sessionId: session.id });
  } catch(e) {
    console.error('Stripe checkout error:', e.message);
    res.status(500).json({ error: 'Checkout failed: ' + e.message });
  }
});

// === STRIPE WEBHOOK ===
router.post('/stripe-webhook', express.raw({ type: 'application/json' }), async function(req, res) {
  var stripe = payments.getStripe();
  if (!stripe) return res.status(200).send('No stripe');
  try {
    var sig = req.headers['stripe-signature'];
    var event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
    if (event.type === 'checkout.session.completed') {
      var session = event.data.object;
      await payments.applyPurchase(session.metadata.userId, session.metadata.itemId, 'stripe');
    }
    res.status(200).send('OK');
  } catch(e) { res.status(400).send('Webhook error: ' + e.message); }
});

// === PAYPAL CHECKOUT ===
router.post('/paypal/:itemId', authenticate, async function(req, res) {
  try {
    init();
    var product = payments.getProduct(req.params.itemId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    var paypalClient = payments.getPayPal();
    if (!paypalClient) {
      // Simulate purchase
      var result = await payments.applyPurchase(req.userId, req.params.itemId, 'paypal_simulated');
      return res.json({ mode: 'simulated', message: 'Purchase successful! ' + product.name + ' added.', product: product });
    }

    // Real PayPal order
    var paypal = require('@paypal/checkout-server-sdk');
    var request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: { currency_code: 'USD', value: product.priceUSD.toFixed(2) },
        description: 'Space Out — ' + product.name,
        custom_id: req.userId.toString() + '|' + req.params.itemId,
      }],
      application_context: {
        return_url: (process.env.FRONTEND_URL || '46.224.104.227:5173') + '?purchase=paypal_success',
        cancel_url: (process.env.FRONTEND_URL || '46.224.104.227:5173') + '?purchase=cancelled',
        brand_name: 'Space Out',
        user_action: 'PAY_NOW',
      }
    });

    var order = await paypalClient.execute(request);
    var approveLink = order.result.links.find(function(l) { return l.rel === 'approve'; });

    res.json({ mode: 'paypal', orderId: order.result.id, approveUrl: approveLink ? approveLink.href : null });
  } catch(e) {
    console.error('PayPal checkout error:', e.message);
    res.status(500).json({ error: 'PayPal checkout failed: ' + e.message });
  }
});

// === PAYPAL CAPTURE (after user approves) ===
router.post('/paypal-capture/:orderId', authenticate, async function(req, res) {
  try {
    var paypalClient = payments.getPayPal();
    if (!paypalClient) return res.status(400).json({ error: 'PayPal not configured' });

    var paypal = require('@paypal/checkout-server-sdk');
    var request = new paypal.orders.OrdersCaptureRequest(req.params.orderId);
    request.requestBody({});
    var capture = await paypalClient.execute(request);

    if (capture.result.status === 'COMPLETED') {
      var customId = capture.result.purchase_units[0].payments.captures[0].custom_id || '';
      var parts = customId.split('|');
      var userId = parts[0];
      var itemId = parts[1];
      if (userId && itemId) {
        await payments.applyPurchase(userId, itemId, 'paypal');
      }
      res.json({ status: 'completed', message: 'Payment captured successfully!' });
    } else {
      res.status(400).json({ error: 'Payment not completed', status: capture.result.status });
    }
  } catch(e) {
    console.error('PayPal capture error:', e.message);
    res.status(500).json({ error: 'Capture failed: ' + e.message });
  }
});

// === GENERIC BUY (auto-selects best method) ===
router.post('/buy/:itemId', authenticate, async function(req, res) {
  try {
    init();
    var method = req.body.method || 'auto'; // 'stripe', 'paypal', 'auto'
    var product = payments.getProduct(req.params.itemId);
    if (!product) return res.status(404).json({ error: 'Product not found: ' + req.params.itemId });

    // Auto-select: prefer Stripe, fallback to PayPal, then simulate
    if (method === 'auto') {
      if (payments.isStripeConfigured()) method = 'stripe';
      else if (payments.isPayPalConfigured()) method = 'paypal';
      else method = 'simulate';
    }

    if (method === 'simulate') {
      await payments.applyPurchase(req.userId, req.params.itemId, 'simulated');
      return res.json({ mode: 'simulated', message: '✅ ' + product.name + ' added to your account!', product: product });
    }

    // Handle Stripe inline (no redirect)
    if (method === 'stripe') {
      var stripe = payments.getStripe();
      if (!stripe) {
        await payments.applyPurchase(req.userId, req.params.itemId, 'stripe_simulated');
        return res.json({ mode: 'simulated', message: '✅ ' + product.name + ' added to your account!', product: product });
      }
      try {
        var session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [{ price_data: { currency: 'usd', product_data: { name: product.name }, unit_amount: Math.round(product.priceUSD * 100) }, quantity: 1 }],
          mode: 'payment',
          success_url: (process.env.FRONTEND_URL || '46.224.104.227:5173') + '?purchase=success&item=' + req.params.itemId,
          cancel_url: (process.env.FRONTEND_URL || '46.224.104.227:5173') + '?purchase=cancelled',
          metadata: { userId: req.userId.toString(), itemId: req.params.itemId },
        });
        return res.json({ mode: 'stripe', url: session.url, sessionId: session.id });
      } catch(stripeErr) {
        console.error('Stripe session error, falling back to simulated:', stripeErr.message);
        await payments.applyPurchase(req.userId, req.params.itemId, 'stripe_fallback');
        return res.json({ mode: 'simulated', message: '✅ ' + product.name + ' added to your account! (Stripe unavailable, applied directly)', product: product });
      }
    }

    // Handle PayPal inline (no redirect)
    if (method === 'paypal') {
      var paypalClient = payments.getPayPal();
      if (!paypalClient) {
        await payments.applyPurchase(req.userId, req.params.itemId, 'paypal_simulated');
        return res.json({ mode: 'simulated', message: '✅ ' + product.name + ' added to your account!', product: product });
      }
      var paypal = require('@paypal/checkout-server-sdk');
      var request = new paypal.orders.OrdersCreateRequest();
      request.prefer('return=representation');
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{ amount: { currency_code: 'USD', value: product.priceUSD.toFixed(2) }, description: product.name, custom_id: req.userId.toString() + '|' + req.params.itemId }],
        application_context: { return_url: (process.env.FRONTEND_URL || '46.224.104.227:5173') + '?purchase=paypal_success', cancel_url: (process.env.FRONTEND_URL || '46.224.104.227:5173') + '?purchase=cancelled', brand_name: 'Space Out', user_action: 'PAY_NOW' }
      });
      var order = await paypalClient.execute(request);
      var approveLink = order.result.links.find(function(l) { return l.rel === 'approve'; });
      return res.json({ mode: 'paypal', orderId: order.result.id, approveUrl: approveLink ? approveLink.href : null });
    }

    res.status(400).json({ error: 'Unknown payment method' });
  } catch(e) {
    console.error('Buy error:', e.message);
    res.status(500).json({ error: 'Purchase failed: ' + e.message });
  }
});

module.exports = router;
