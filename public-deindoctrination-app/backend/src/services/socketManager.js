/**
 * WebSocket Manager — Real-time MMO system using Socket.io
 * Handles: player sync, area-of-interest, global events, chat, presence
 */
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Node = require('../models/Node');
const world = require('./worldManager');

let io = null;
const onlineUsers = new Map(); // odId -> Set of socketIds
const userSockets = new Map(); // odId -> socket (latest)

function init(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:5174'],
      credentials: true
    },
    pingInterval: 10000,
    pingTimeout: 5000
  });

  // Auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId || decoded.id;
      next();
    } catch (e) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const odId = socket.userId;
    console.log(`🔌 Connected: ${odId} (${socket.id})`);

    if (!onlineUsers.has(odId)) onlineUsers.set(odId, new Set());
    onlineUsers.get(odId).add(socket.id);
    userSockets.set(odId, socket);

    io.emit('presence', { odId, status: 'online', count: onlineUsers.size });

    // === PLAYER POSITION SYNC (MMO core) ===
    socket.on('player:move', (data) => {
      const { x, y, zone, profile } = data;
      world.updatePlayerPosition(odId, x, y, zone || 'overworld', profile);

      // Get nearby players and send back
      const nearby = world.getNearbyPlayers(odId, 2000);
      socket.emit('players:nearby', nearby);

      // Broadcast to nearby players that this player moved
      for (const p of nearby) {
        if (userSockets.has(p.userId)) {
          userSockets.get(p.userId).emit('player:moved', {
            userId: odId, x, y, zone,
            email: profile?.email, rank: profile?.rank, status: profile?.status,
            shipColor: profile?.shipColor || null
          });
        }
      }
    });

    // === PLAYER DISCONNECT FROM WORLD ===
    socket.on('player:leave', () => {
      world.removePlayer(odId);
      io.emit('player:left', { userId: odId });
    });

    // === GET WORLD STATE ===
    socket.on('world:state', () => {
      socket.emit('world:state', world.getWorldState());
    });

    // === GET ACTIVE EVENTS ===
    socket.on('world:events', () => {
      socket.emit('world:events', world.getActiveEvents());
    });

    // === SOCIAL INTERACTIONS ===
    socket.on('social:wave', (data) => {
      const { targetId } = data;
      if (targetId && userSockets.has(targetId)) {
        const profile = world.playerProfiles.get(odId) || {};
        userSockets.get(targetId).emit('social:wave', {
          fromId: odId,
          fromEmail: profile.email || 'A player',
          message: `👋 ${profile.email?.split('@')[0] || 'Someone'} waved at you!`
        });
      }
    });

    socket.on('social:challenge', (data) => {
      const { targetId } = data;
      if (targetId && userSockets.has(targetId)) {
        const profile = world.playerProfiles.get(odId) || {};
        userSockets.get(targetId).emit('social:challenge', {
          fromId: odId,
          fromEmail: profile.email || 'A player',
          message: `⚔️ ${profile.email?.split('@')[0] || 'Someone'} challenged you!`
        });
      }
    });

    // === WORLD CONTRIBUTION (task completion contributes to civ level) ===
    socket.on('world:contribute', (data) => {
      const result = world.contributeToWorld(odId, data.type, data.amount);
      if (result.levelUp) {
        io.emit('world:levelup', { level: result.newLevel, contributor: odId });
        io.emit('world:event', {
          id: 'civ_levelup',
          name: `🏆 Civilization Level ${result.newLevel}!`,
          description: 'The collective effort of all players has advanced civilization!',
          duration: 30000
        });
      }
    });

    // === NODE REGISTRATION ===
    socket.on('node:register', async (data) => {
      const { nodeId } = data;
      if (nodeId) {
        socket.join('node:' + nodeId);
        await Node.updateOne({ nodeId, userId: odId }, { status: 'online', lastHeartbeat: new Date() }).catch(() => {});
        io.emit('node:status', { nodeId, status: 'online' });
      }
    });

    socket.on('node:heartbeat', async (data) => {
      if (data?.nodeId) {
        await Node.updateOne({ nodeId: data.nodeId, userId: odId }, { status: 'online', lastHeartbeat: new Date() }).catch(() => {});
      }
    });

    // === COMMAND RELAY ===
    socket.on('command:send', (data) => {
      const { targetNodeId, action, payload } = data;
      io.to('node:' + targetNodeId).emit('command', { from: odId, action, payload, timestamp: new Date() });
    });

    // === REAL-TIME CHAT ===
    socket.on('chat:message', (data) => {
      io.emit('chat:message', { odId, message: data.message, timestamp: new Date() });
    });

    // === DISCONNECT ===
    socket.on('disconnect', async () => {
      if (onlineUsers.has(odId)) {
        onlineUsers.get(odId).delete(socket.id);
        if (onlineUsers.get(odId).size === 0) {
          onlineUsers.delete(odId);
          userSockets.delete(odId);
          world.removePlayer(odId);
          io.emit('presence', { userId: odId, status: 'offline', count: onlineUsers.size });
          io.emit('player:left', { userId: odId });
          await Node.updateMany({ userId: odId, status: 'online' }, { status: 'offline' }).catch(() => {});
        }
      }
    });
  });

  // === WORLD TICK (every 30 seconds) ===
  setInterval(() => {
    const event = world.worldTick();
    if (event) {
      io.emit('world:event', event);
      console.log(`🌍 Global Event: ${event.name}`);
    }
    // Broadcast world state to all
    io.emit('world:tick', {
      playerCount: world.playerPositions.size,
      onlineUsers: onlineUsers.size,
      activeEvents: world.getActiveEvents(),
      civilizationLevel: world.getWorldState().civilizationLevel
    });
  }, 30000);

  console.log('✅ WebSocket MMO system initialized');
  return io;
}

function getIO() { return io; }
function getOnlineUsers() { return onlineUsers; }
function getOnlineCount() { return onlineUsers.size; }

function emitActivity(activity) { if (io) io.emit('activity', activity); }

function emitToUser(odId, event, data) {
  if (io && userSockets.has(odId.toString())) {
    userSockets.get(odId.toString()).emit(event, data);
  }
}

module.exports = { init, getIO, getOnlineUsers, getOnlineCount, emitActivity, emitToUser };
