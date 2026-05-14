const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const gc = require('../controllers/gameConfigController');

// Public — frontend reads configs
router.get('/public', gc.getAllConfigs);
router.get('/category/:category', authenticate, gc.getConfigsByCategory);

// Admin — with auth (also accessible with just authenticate for debugging)
router.get('/admin', authenticate, gc.getAdminConfigs);
router.post('/admin', authenticate, gc.updateConfig);
router.delete('/admin/:key', authenticate, gc.deleteConfig);

module.exports = router;
