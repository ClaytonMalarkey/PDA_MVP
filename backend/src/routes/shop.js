const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const sc = require('../controllers/shopController');

router.get('/items', authenticate, sc.getShopItems);
router.post('/buy/:itemId', authenticate, sc.purchaseWithCurrency);
router.post('/buy-usd/:itemId', authenticate, sc.purchaseWithStripe);
router.post('/ad-reward', authenticate, sc.claimAdReward);
router.get('/history', authenticate, sc.getPurchaseHistory);

module.exports = router;
