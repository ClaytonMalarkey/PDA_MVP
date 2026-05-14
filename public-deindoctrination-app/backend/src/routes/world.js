const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const world = require('../services/worldManager');

// Get world state (public)
router.get('/state', authenticate, (req, res) => {
  res.json(world.getWorldState());
});

// Get active global events
router.get('/events', authenticate, (req, res) => {
  res.json(world.getActiveEvents());
});

// Get active effects (multipliers etc)
router.get('/effects', authenticate, (req, res) => {
  res.json(world.getActiveEffects());
});

// Get available event types (admin)
router.get('/event-types', authenticate, (req, res) => {
  res.json(world.EVENT_TYPES);
});

// Get nearby players (REST fallback)
router.get('/nearby', authenticate, (req, res) => {
  const nearby = world.getNearbyPlayers(req.userId.toString(), 2000);
  res.json(nearby);
});

// Get players in zone
router.get('/zone/:zone', authenticate, (req, res) => {
  const players = world.getPlayersInZone(req.params.zone);
  res.json(players);
});

// Contribute to world
router.post('/contribute', authenticate, (req, res) => {
  const { type, amount } = req.body;
  if (!type || !amount) return res.status(400).json({ error: 'type and amount required' });
  const result = world.contributeToWorld(req.userId.toString(), type, Math.min(amount, 1000));

  const io = req.app.get('io');
  if (result.levelUp && io) {
    io.emit('world:levelup', { level: result.newLevel });
  }
  res.json(result);
});

// === ADMIN: Trigger global event ===
router.post('/events/trigger', authenticate, requireAdmin, (req, res) => {
  const { eventId } = req.body;
  const event = eventId ? world.triggerGlobalEvent(eventId) : world.triggerRandomEvent();
  if (!event) return res.status(400).json({ error: 'Invalid event ID' });

  const io = req.app.get('io');
  if (io) io.emit('world:event', event);

  res.json(event);
});

module.exports = router;
