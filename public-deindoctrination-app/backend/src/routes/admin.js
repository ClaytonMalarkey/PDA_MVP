const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const categoryController = require('../controllers/categoryController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validateTask, validateShopItem, validateStructure, validateCategory } = require('../middleware/validate');

// Apply authentication and admin check to all routes
router.use(authenticate);
router.use(requireAdmin);

// Category management
router.get('/categories', categoryController.getAllCategories);
router.post('/categories', validateCategory, categoryController.createCategory);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

// Task management
router.get('/tasks', adminController.getAllTasks);
router.post('/tasks', validateTask, adminController.createTask);
router.put('/tasks/:id', adminController.updateTask);
router.delete('/tasks/:id', adminController.deleteTask);

// User management
router.get('/users', adminController.getAllUsers);
router.put('/users/:userId/role', adminController.updateUserRole);
router.post('/users/:userId/ban', adminController.banUser);

// Verification management
router.get('/verifications', adminController.getPendingVerifications);
router.post('/verifications/:id/approve', adminController.approveVerification);
router.post('/verifications/:id/reject', adminController.rejectVerification);

// Metrics
router.get('/metrics', adminController.getMetrics);

// UI Config
router.get('/ui-config', adminController.getUIConfig);
router.put('/ui-config', adminController.updateUIConfig);

// Empire management
router.get('/empires', adminController.getAllEmpires);

// Node management
const Node = require('../models/Node');
router.get('/nodes', async (req, res) => {
  try {
    const nodes = await Node.find({}).populate('userId', 'email xp rank').sort({ createdAt: -1 });
    res.json(nodes);
  } catch (e) { res.status(500).json({ error: 'Failed to fetch nodes' }); }
});
router.delete('/nodes/:nodeId', async (req, res) => {
  try { await Node.findOneAndDelete({ nodeId: req.params.nodeId }); res.json({ message: 'Deleted' }); }
  catch (e) { res.status(500).json({ error: 'Failed' }); }
});

// Plugin management
const Plugin = require('../models/Plugin');
router.get('/plugins', async (req, res) => {
  try { res.json(await Plugin.find({}).sort({ downloads: -1 })); } catch (e) { res.status(500).json({ error: 'Failed' }); }
});
router.put('/plugins/:pluginId', async (req, res) => {
  try {
    const update = {};
    ['isActive','isVerified','isPublished','name','description','category','price','isPaid'].forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
    const plugin = await Plugin.findOneAndUpdate({ pluginId: req.params.pluginId }, update, { new: true });
    if (!plugin) return res.status(404).json({ error: 'Plugin not found' });
    res.json(plugin);
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});
router.delete('/plugins/:pluginId', async (req, res) => {
  try { await Plugin.findOneAndDelete({ pluginId: req.params.pluginId }); res.json({ message: 'Deleted' }); }
  catch (e) { res.status(500).json({ error: 'Failed' }); }
});

// === SHOP ITEMS CRUD ===
const ShopItem = require('../models/ShopItem');
router.get('/shop-items', async (req, res) => {
  try { res.json(await ShopItem.find({}).sort({ category: 1, sortOrder: 1 })); } catch (e) { res.status(500).json({ error: 'Failed' }); }
});
router.post('/shop-items', validateShopItem, async (req, res) => {
  try { res.status(201).json(await ShopItem.create(req.body)); } catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/shop-items/:id', async (req, res) => {
  try { res.json(await ShopItem.findByIdAndUpdate(req.params.id, req.body, { new: true })); } catch (e) { res.status(500).json({ error: 'Failed' }); }
});
router.delete('/shop-items/:id', async (req, res) => {
  try { await ShopItem.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

// === STRUCTURES CRUD ===
const Structure = require('../models/Structure');
router.get('/structures', async (req, res) => {
  try { res.json(await Structure.find({})); } catch (e) { res.status(500).json({ error: 'Failed' }); }
});
router.post('/structures', validateStructure, async (req, res) => {
  try { res.status(201).json(await Structure.create(req.body)); } catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/structures/:id', async (req, res) => {
  try { res.json(await Structure.findByIdAndUpdate(req.params.id, req.body, { new: true })); } catch (e) { res.status(500).json({ error: 'Failed' }); }
});
router.delete('/structures/:id', async (req, res) => {
  try { await Structure.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

// === RESEARCH NODES ===
const ResearchNode = require('../models/ResearchNode');
router.get('/research-nodes', async (req, res) => {
  try { res.json(await ResearchNode.find({}).sort({ domain: 1, tier: 1 }).limit(200)); } catch (e) { res.status(500).json({ error: 'Failed' }); }
});
router.put('/research-nodes/:id', async (req, res) => {
  try { res.json(await ResearchNode.findByIdAndUpdate(req.params.id, req.body, { new: true })); } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

// === CIVILIZATIONS CRUD ===
const Civilization = require('../models/Civilization');
router.get('/civilizations', async (req, res) => {
  try { res.json(await Civilization.find({}).populate('leaderId', 'email')); } catch (e) { res.status(500).json({ error: 'Failed' }); }
});
router.put('/civilizations/:id', async (req, res) => {
  try { res.json(await Civilization.findByIdAndUpdate(req.params.id, req.body, { new: true })); } catch (e) { res.status(500).json({ error: 'Failed' }); }
});
router.delete('/civilizations/:id', async (req, res) => {
  try { await Civilization.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

// === GUILDS ===
const Guild = require('../models/Guild');
router.get('/guilds', async (req, res) => {
  try { res.json(await Guild.find({})); } catch (e) { res.status(500).json({ error: 'Failed' }); }
});
router.put('/guilds/:id', async (req, res) => {
  try { res.json(await Guild.findByIdAndUpdate(req.params.id, req.body, { new: true })); } catch (e) { res.status(500).json({ error: 'Failed' }); }
});
router.delete('/guilds/:id', async (req, res) => {
  try { await Guild.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

// === GLOBAL PROJECTS ===
const GlobalProject = require('../models/GlobalProject');
router.get('/projects', async (req, res) => {
  try { res.json(await GlobalProject.find({})); } catch (e) { res.status(500).json({ error: 'Failed' }); }
});
router.put('/projects/:id', async (req, res) => {
  try { res.json(await GlobalProject.findByIdAndUpdate(req.params.id, req.body, { new: true })); } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

// === PURCHASES / TRANSACTIONS ===
const Purchase = require('../models/Purchase');
const Transaction = require('../models/Transaction');
router.get('/purchases', async (req, res) => {
  try { res.json(await Purchase.find({}).populate('userId', 'email').sort({ createdAt: -1 }).limit(200)); } catch (e) { res.status(500).json({ error: 'Failed' }); }
});
router.get('/transactions', async (req, res) => {
  try { res.json(await Transaction.find({}).populate('userId', 'email').sort({ createdAt: -1 }).limit(200)); } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

// === SOCIAL: Chat, Friends, Challenges ===
const { Chat, Challenge, Gift, Achievement } = require('../models/Social');
router.get('/chats', async (req, res) => {
  try { res.json(await Chat.find({}).populate('senderId', 'email').sort({ createdAt: -1 }).limit(100)); } catch (e) { res.status(500).json({ error: 'Failed' }); }
});
router.delete('/chats/:id', async (req, res) => {
  try { await Chat.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); } catch (e) { res.status(500).json({ error: 'Failed' }); }
});
router.get('/challenges', async (req, res) => {
  try { res.json(await Challenge.find({}).populate('challengerId targetId', 'email').sort({ createdAt: -1 })); } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

// === ACTIVITY FEED ===
const ActivityFeed = require('../models/ActivityFeed');
router.get('/activity-feed', async (req, res) => {
  try { res.json(await ActivityFeed.find({}).populate('userId', 'email').sort({ createdAt: -1 }).limit(100)); } catch (e) { res.status(500).json({ error: 'Failed' }); }
});
router.delete('/activity-feed/:id', async (req, res) => {
  try { await ActivityFeed.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

// === USER EDIT (full) ===
const User = require('../models/User');
router.put('/users/:id', async (req, res) => {
  try {
    const allowed = ['xp','rank','currency','energy','maxEnergy','influencePoints','innovationTokens','legacyStones','knowledgePoints','streak','isPremium','role','hubLevel'];
    const update = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
    res.json(await User.findByIdAndUpdate(req.params.id, update, { new: true }));
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});
router.delete('/users/:id', async (req, res) => {
  try { await User.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

module.exports = router;
