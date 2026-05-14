const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Node = require('../models/Node');
const ActivityFeed = require('../models/ActivityFeed');
const crypto = require('crypto');

// Register a new node
router.post('/register', authenticate, async (req, res) => {
  try {
    const { name, type, capabilities, metadata } = req.body;
    const nodeId = 'node-' + crypto.randomBytes(8).toString('hex');

    const node = await Node.create({
      nodeId,
      userId: req.userId,
      name: name || 'Node ' + nodeId.slice(-6),
      type: type || 'browser',
      capabilities: capabilities || ['compute', 'display'],
      status: 'online',
      lastHeartbeat: new Date(),
      metadata: metadata || {}
    });

    await ActivityFeed.create({
      userId: req.userId, type: 'node_register',
      message: `Registered new node: ${node.name}`, icon: '🖥️',
      metadata: { nodeId: node.nodeId, type: node.type }
    });

    // Emit via socket if available
    const io = req.app.get('io');
    if (io) io.emit('activity', { type: 'node_register', nodeId: node.nodeId, name: node.name });

    res.status(201).json(node);
  } catch (e) {
    res.status(500).json({ error: 'Failed to register node: ' + e.message });
  }
});

// Get my nodes
router.get('/mine', authenticate, async (req, res) => {
  try {
    const nodes = await Node.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(nodes);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch nodes' });
  }
});

// Get all online nodes (public)
router.get('/online', authenticate, async (req, res) => {
  try {
    const cutoff = new Date(Date.now() - 5 * 60 * 1000); // 5 min
    const nodes = await Node.find({ status: 'online', lastHeartbeat: { $gte: cutoff } })
      .select('nodeId name type capabilities status userId lastHeartbeat')
      .populate('userId', 'email xp rank')
      .limit(100);
    res.json(nodes);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch online nodes' });
  }
});

// Heartbeat
router.post('/:nodeId/heartbeat', authenticate, async (req, res) => {
  try {
    const node = await Node.findOneAndUpdate(
      { nodeId: req.params.nodeId, userId: req.userId },
      { status: 'online', lastHeartbeat: new Date(), $inc: { 'stats.uptime': 30 } },
      { new: true }
    );
    if (!node) return res.status(404).json({ error: 'Node not found' });
    res.json({ status: 'ok', nodeId: node.nodeId });
  } catch (e) {
    res.status(500).json({ error: 'Heartbeat failed' });
  }
});

// Send command to a node
router.post('/:nodeId/command', authenticate, async (req, res) => {
  try {
    const { action, payload } = req.body;
    const node = await Node.findOne({ nodeId: req.params.nodeId });
    if (!node) return res.status(404).json({ error: 'Node not found' });

    await Node.updateOne({ nodeId: req.params.nodeId }, { $inc: { 'stats.commandsReceived': 1 } });

    // Emit command via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to('node:' + req.params.nodeId).emit('command', {
        from: req.userId, action, payload, timestamp: new Date()
      });
    }

    res.json({ message: 'Command sent', nodeId: req.params.nodeId, action });
  } catch (e) {
    res.status(500).json({ error: 'Command failed: ' + e.message });
  }
});

// Update node
router.put('/:nodeId', authenticate, async (req, res) => {
  try {
    const { name, capabilities, status } = req.body;
    const update = {};
    if (name) update.name = name;
    if (capabilities) update.capabilities = capabilities;
    if (status) update.status = status;

    const node = await Node.findOneAndUpdate(
      { nodeId: req.params.nodeId, userId: req.userId },
      update, { new: true }
    );
    if (!node) return res.status(404).json({ error: 'Node not found' });
    res.json(node);
  } catch (e) {
    res.status(500).json({ error: 'Update failed' });
  }
});

// Delete node
router.delete('/:nodeId', authenticate, async (req, res) => {
  try {
    const node = await Node.findOneAndDelete({ nodeId: req.params.nodeId, userId: req.userId });
    if (!node) return res.status(404).json({ error: 'Node not found' });
    res.json({ message: 'Node removed' });
  } catch (e) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;
