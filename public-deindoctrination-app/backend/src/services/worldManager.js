/**
 * World Manager — MMO shared world state
 * Handles: player positions, area-of-interest, zones, global state
 * Uses spatial partitioning for efficient nearby-player queries
 */

// Grid-based spatial partitioning (simple quadtree alternative)
const CELL_SIZE = 500; // world units per cell
const playerPositions = new Map(); // odId -> { x, y, zone, lastUpdate }
const playerProfiles = new Map(); // odId -> { email, rank, xp, avatar, status }

// Global world state
const worldState = {
  onlinePlayers: 0,
  totalContributions: 0,
  civilizationLevel: 1,
  activeEvents: [],
  globalResources: { energy: 100000, knowledge: 50000, influence: 25000 },
  worldAge: 0 // ticks since start
};

function getCellKey(x, y) {
  return `${Math.floor(x / CELL_SIZE)},${Math.floor(y / CELL_SIZE)}`;
}

function updatePlayerPosition(userId, x, y, zone, profile) {
  playerPositions.set(userId, { x, y, zone, lastUpdate: Date.now() });
  if (profile) playerProfiles.set(userId, profile);
}

function removePlayer(userId) {
  playerPositions.delete(userId);
  playerProfiles.delete(userId);
}

// Get nearby players within a radius (area-of-interest)
function getNearbyPlayers(userId, radius = 1500) {
  const pos = playerPositions.get(userId);
  if (!pos) return [];

  const nearby = [];
  const r2 = radius * radius;

  for (const [id, p] of playerPositions) {
    if (id === userId) continue;
    const dx = p.x - pos.x;
    const dy = p.y - pos.y;
    if (dx * dx + dy * dy <= r2) {
      const profile = playerProfiles.get(id) || {};
      nearby.push({
        userId: id, x: p.x, y: p.y, zone: p.zone,
        email: profile.email, rank: profile.rank, xp: profile.xp,
        status: profile.status || 'exploring',
        shipColor: profile.shipColor || null
      });
    }
  }
  return nearby;
}

// Get all players in a zone
function getPlayersInZone(zone) {
  const players = [];
  for (const [id, p] of playerPositions) {
    if (p.zone === zone) {
      const profile = playerProfiles.get(id) || {};
      players.push({ userId: id, x: p.x, y: p.y, ...profile });
    }
  }
  return players;
}

// === GLOBAL EVENT ENGINE ===
const EVENT_TYPES = [
  { id: 'resource_surge', name: '⚡ Resource Surge', description: 'All resource gains doubled for 10 minutes!', duration: 600000, effect: { multiplier: 2 } },
  { id: 'xp_festival', name: '🎉 XP Festival', description: 'Triple XP for all tasks!', duration: 900000, effect: { xpMultiplier: 3 } },
  { id: 'invasion', name: '👾 Alien Invasion', description: 'Defeat enemies for bonus loot! Enemy spawn rate 3x.', duration: 600000, effect: { enemyMultiplier: 3 } },
  { id: 'meteor_shower', name: '☄️ Meteor Shower', description: 'Rare minerals falling from the sky! Mine for bonus resources.', duration: 480000, effect: { mineBonus: 5 } },
  { id: 'trade_boom', name: '💰 Trade Boom', description: 'All shop prices reduced by 30%!', duration: 720000, effect: { priceMultiplier: 0.7 } },
  { id: 'unity_call', name: '🤝 Unity Call', description: 'Civilization contribution points doubled!', duration: 600000, effect: { civMultiplier: 2 } },
  { id: 'knowledge_wave', name: '📚 Knowledge Wave', description: 'Research speed doubled!', duration: 600000, effect: { researchMultiplier: 2 } },
  { id: 'power_outage', name: '🔋 Power Outage', description: 'Energy costs halved for all actions!', duration: 480000, effect: { energyCostMultiplier: 0.5 } },
];

function triggerGlobalEvent(eventId) {
  const template = EVENT_TYPES.find(e => e.id === eventId);
  if (!template) return null;

  const event = {
    ...template,
    startedAt: Date.now(),
    expiresAt: Date.now() + template.duration,
    active: true
  };

  // Remove expired events
  worldState.activeEvents = worldState.activeEvents.filter(e => e.expiresAt > Date.now());
  worldState.activeEvents.push(event);
  return event;
}

function triggerRandomEvent() {
  const idx = Math.floor(Math.random() * EVENT_TYPES.length);
  return triggerGlobalEvent(EVENT_TYPES[idx].id);
}

function getActiveEvents() {
  worldState.activeEvents = worldState.activeEvents.filter(e => e.expiresAt > Date.now());
  return worldState.activeEvents;
}

function getActiveEffects() {
  const effects = {};
  for (const event of getActiveEvents()) {
    Object.assign(effects, event.effect);
  }
  return effects;
}

// === PLAYER INFLUENCE SYSTEM ===
function contributeToWorld(userId, type, amount) {
  worldState.totalContributions += amount;

  switch (type) {
    case 'task': worldState.globalResources.knowledge += amount; break;
    case 'build': worldState.globalResources.energy += amount; break;
    case 'social': worldState.globalResources.influence += amount; break;
  }

  // Level up civilization
  const threshold = worldState.civilizationLevel * 10000;
  if (worldState.totalContributions >= threshold) {
    worldState.civilizationLevel++;
    return { levelUp: true, newLevel: worldState.civilizationLevel };
  }
  return { levelUp: false };
}

// World tick (called periodically)
function worldTick() {
  worldState.worldAge++;
  worldState.onlinePlayers = playerPositions.size;

  // Clean stale positions (no update in 60s)
  const cutoff = Date.now() - 60000;
  for (const [id, p] of playerPositions) {
    if (p.lastUpdate < cutoff) {
      playerPositions.delete(id);
      playerProfiles.delete(id);
    }
  }

  // Random event chance (1% per tick, tick every 30s = ~event every 50 min)
  if (worldState.activeEvents.length === 0 && Math.random() < 0.01) {
    return triggerRandomEvent();
  }
  return null;
}

function getWorldState() {
  return {
    ...worldState,
    activeEvents: getActiveEvents(),
    playerCount: playerPositions.size
  };
}

module.exports = {
  updatePlayerPosition, removePlayer, getNearbyPlayers, getPlayersInZone,
  triggerGlobalEvent, triggerRandomEvent, getActiveEvents, getActiveEffects,
  contributeToWorld, worldTick, getWorldState, EVENT_TYPES,
  getCellKey, playerPositions, playerProfiles
};
