const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Plugin = require('../models/Plugin');
const NodePlugin = require('../models/NodePlugin');
const Node = require('../models/Node');
const ActivityFeed = require('../models/ActivityFeed');
const User = require('../models/User');

// === MARKETPLACE: Browse published plugins ===
router.get('/marketplace', authenticate, async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    const filter = { isPublished: true, isActive: true };
    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const sortBy = sort === 'rating' ? { rating: -1 } : sort === 'newest' ? { createdAt: -1 } : { downloads: -1 };
    const plugins = await Plugin.find(filter).sort(sortBy).limit(50);
    res.json(plugins);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch marketplace' });
  }
});

// Get all system (built-in) plugins
router.get('/system', authenticate, async (req, res) => {
  try {
    const plugins = await Plugin.find({ isSystem: true, isActive: true });
    res.json(plugins);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch system plugins' });
  }
});

// Get single plugin details
router.get('/:pluginId', authenticate, async (req, res) => {
  try {
    const plugin = await Plugin.findOne({ pluginId: req.params.pluginId });
    if (!plugin) return res.status(404).json({ error: 'Plugin not found' });
    res.json(plugin);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch plugin' });
  }
});

// === PUBLISH a new plugin ===
router.post('/publish', authenticate, async (req, res) => {
  try {
    const { name, description, category, permissions, actions, tags, isPaid, price, icon } = req.body;
    if (!name) return res.status(400).json({ error: 'Plugin name required' });

    const pluginId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const existing = await Plugin.findOne({ pluginId });
    if (existing) return res.status(409).json({ error: 'Plugin ID already exists' });

    const user = await User.findById(req.userId);
    const plugin = await Plugin.create({
      pluginId, name, description: description || '',
      icon: icon || '🔌',
      category: category || 'utility',
      author: req.userId,
      authorName: user?.email?.split('@')[0] || 'Unknown',
      permissions: permissions || [],
      actions: actions || [],
      tags: tags || [],
      isPaid: isPaid || false,
      price: price || 0,
      isPublished: true
    });

    await ActivityFeed.create({
      userId: req.userId, type: 'plugin_publish',
      message: `Published plugin: ${plugin.name}`, icon: '🔌',
      metadata: { pluginId: plugin.pluginId }, isGlobal: true
    });

    const io = req.app.get('io');
    if (io) io.emit('activity', { type: 'plugin_publish', pluginId: plugin.pluginId, name: plugin.name });

    res.status(201).json(plugin);
  } catch (e) {
    res.status(500).json({ error: 'Publish failed: ' + e.message });
  }
});

// === INSTALL plugin on a node ===
router.post('/:pluginId/install/:nodeId', authenticate, async (req, res) => {
  try {
    const plugin = await Plugin.findOne({ pluginId: req.params.pluginId });
    if (!plugin) return res.status(404).json({ error: 'Plugin not found' });

    const node = await Node.findOne({ nodeId: req.params.nodeId, userId: req.userId });
    if (!node) return res.status(404).json({ error: 'Node not found or not yours' });

    // Check if already installed
    const existing = await NodePlugin.findOne({ nodeId: req.params.nodeId, pluginId: req.params.pluginId });
    if (existing) return res.status(409).json({ error: 'Plugin already installed on this node' });

    // If paid, check credits
    if (plugin.isPaid && plugin.price > 0) {
      const user = await User.findById(req.userId);
      if (user.currency < plugin.price) return res.status(400).json({ error: 'Not enough credits. Need ' + plugin.price });
      user.currency -= plugin.price;
      await user.save();
      // Credit the author
      if (plugin.author) {
        await User.updateOne({ _id: plugin.author }, { $inc: { currency: Math.floor(plugin.price * 0.85) } });
      }
    }

    await NodePlugin.create({
      nodeId: req.params.nodeId, pluginId: req.params.pluginId, userId: req.userId
    });

    // Update node's installed plugins list
    await Node.updateOne({ nodeId: req.params.nodeId }, { $addToSet: { installedPlugins: req.params.pluginId } });
    await Plugin.updateOne({ pluginId: req.params.pluginId }, { $inc: { downloads: 1 } });

    await ActivityFeed.create({
      userId: req.userId, type: 'plugin_install',
      message: `Installed ${plugin.name} on ${node.name}`, icon: plugin.icon,
      metadata: { pluginId: plugin.pluginId, nodeId: node.nodeId }
    });

    const io = req.app.get('io');
    if (io) io.emit('activity', { type: 'plugin_install', pluginId: plugin.pluginId, nodeName: node.name });

    res.json({ message: `${plugin.name} installed on ${node.name}` });
  } catch (e) {
    res.status(500).json({ error: 'Install failed: ' + e.message });
  }
});

// Uninstall plugin from node
router.delete('/:pluginId/uninstall/:nodeId', authenticate, async (req, res) => {
  try {
    await NodePlugin.findOneAndDelete({ nodeId: req.params.nodeId, pluginId: req.params.pluginId, userId: req.userId });
    await Node.updateOne({ nodeId: req.params.nodeId }, { $pull: { installedPlugins: req.params.pluginId } });
    res.json({ message: 'Plugin uninstalled' });
  } catch (e) {
    res.status(500).json({ error: 'Uninstall failed' });
  }
});

// Get plugins installed on a node
router.get('/node/:nodeId', authenticate, async (req, res) => {
  try {
    const installed = await NodePlugin.find({ nodeId: req.params.nodeId, userId: req.userId });
    const pluginIds = installed.map(i => i.pluginId);
    const plugins = await Plugin.find({ pluginId: { $in: pluginIds } });
    res.json(plugins.map(p => ({
      ...p.toObject(),
      isEnabled: installed.find(i => i.pluginId === p.pluginId)?.isEnabled ?? true
    })));
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch node plugins' });
  }
});

// Toggle plugin on/off on a node
router.post('/:pluginId/toggle/:nodeId', authenticate, async (req, res) => {
  try {
    const np = await NodePlugin.findOne({ nodeId: req.params.nodeId, pluginId: req.params.pluginId, userId: req.userId });
    if (!np) return res.status(404).json({ error: 'Plugin not installed on this node' });
    np.isEnabled = !np.isEnabled;
    await np.save();
    res.json({ pluginId: np.pluginId, nodeId: np.nodeId, isEnabled: np.isEnabled });
  } catch (e) {
    res.status(500).json({ error: 'Toggle failed' });
  }
});

// Execute a plugin action
router.post('/:pluginId/execute', authenticate, async (req, res) => {
  try {
    const { nodeId, actionName, params } = req.body;
    const plugin = await Plugin.findOne({ pluginId: req.params.pluginId });
    if (!plugin) return res.status(404).json({ error: 'Plugin not found' });

    const action = plugin.actions.find(a => a.name === actionName);
    if (!action) return res.status(400).json({ error: 'Action not found: ' + actionName });

    // Verify plugin is installed on the node
    if (nodeId) {
      const np = await NodePlugin.findOne({ nodeId, pluginId: req.params.pluginId, userId: req.userId, isEnabled: true });
      if (!np) return res.status(400).json({ error: 'Plugin not installed/enabled on this node' });
    }

    // Emit execution command via WebSocket
    const io = req.app.get('io');
    if (io && nodeId) {
      io.to('node:' + nodeId).emit('plugin-execute', {
        pluginId: req.params.pluginId, actionName, params, from: req.userId
      });
    }

    // Update stats
    if (nodeId) await Node.updateOne({ nodeId }, { $inc: { 'stats.tasksExecuted': 1 } });

    res.json({ message: `Executed ${actionName} on ${plugin.name}`, pluginId: plugin.pluginId, actionName });
  } catch (e) {
    res.status(500).json({ error: 'Execution failed: ' + e.message });
  }
});

// Rate a plugin
router.post('/:pluginId/rate', authenticate, async (req, res) => {
  try {
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1-5' });
    const plugin = await Plugin.findOne({ pluginId: req.params.pluginId });
    if (!plugin) return res.status(404).json({ error: 'Plugin not found' });

    const newCount = plugin.ratingCount + 1;
    const newRating = ((plugin.rating * plugin.ratingCount) + rating) / newCount;
    plugin.rating = Math.round(newRating * 10) / 10;
    plugin.ratingCount = newCount;
    await plugin.save();

    res.json({ rating: plugin.rating, ratingCount: plugin.ratingCount });
  } catch (e) {
    res.status(500).json({ error: 'Rating failed' });
  }
});

module.exports = router;
