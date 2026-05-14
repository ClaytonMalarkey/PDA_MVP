#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const Plugin = require('../models/Plugin');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  await Plugin.deleteMany({});

  const plugins = [
    // === SYSTEM PLUGINS (built-in) ===
    {
      pluginId: 'remote-control', name: 'Remote Control', icon: '🎮',
      description: 'Send commands between nodes. Control any device in your network remotely.',
      category: 'utility', isSystem: true, isPublished: true, isVerified: true,
      permissions: ['network', 'input'],
      actions: [
        { name: 'sendCommand', description: 'Send a command to target node', params: { targetNodeId: 'string', command: 'string' } },
        { name: 'getStatus', description: 'Get target node status', params: { targetNodeId: 'string' } },
        { name: 'ping', description: 'Ping a node', params: { targetNodeId: 'string' } }
      ],
      tags: ['remote', 'control', 'network', 'command']
    },
    {
      pluginId: 'node-storage', name: 'Node Storage', icon: '💾',
      description: 'Turn any node into a storage unit. Upload, download, and share files across your network.',
      category: 'storage', isSystem: true, isPublished: true, isVerified: true,
      permissions: ['storage', 'network'],
      actions: [
        { name: 'upload', description: 'Upload file to node storage', params: { nodeId: 'string', fileName: 'string' } },
        { name: 'download', description: 'Download file from node', params: { nodeId: 'string', fileName: 'string' } },
        { name: 'listFiles', description: 'List files on a node', params: { nodeId: 'string' } },
        { name: 'deleteFile', description: 'Delete a file', params: { nodeId: 'string', fileName: 'string' } }
      ],
      tags: ['storage', 'files', 'backup', 'sync']
    },
    {
      pluginId: 'task-reward', name: 'Task & Reward Engine', icon: '🏆',
      description: 'Assign real-world tasks, track completion, and distribute rewards automatically.',
      category: 'productivity', isSystem: true, isPublished: true, isVerified: true,
      permissions: ['system'],
      actions: [
        { name: 'assignTask', description: 'Assign a task to a user', params: { userId: 'string', taskId: 'string' } },
        { name: 'completeTask', description: 'Mark task as complete', params: { taskId: 'string' } },
        { name: 'claimReward', description: 'Claim reward for completed task', params: { taskId: 'string' } }
      ],
      tags: ['tasks', 'rewards', 'productivity', 'gamification']
    },
    {
      pluginId: 'analytics-dashboard', name: 'Analytics Dashboard', icon: '📊',
      description: 'Real-time analytics for your node network. Track performance, uptime, and usage.',
      category: 'analytics', isSystem: true, isPublished: true, isVerified: true,
      permissions: ['system', 'network'],
      actions: [
        { name: 'getNodeStats', description: 'Get stats for a node', params: { nodeId: 'string' } },
        { name: 'getNetworkOverview', description: 'Get network-wide stats', params: {} },
        { name: 'getActivityLog', description: 'Get recent activity', params: { limit: 'number' } }
      ],
      tags: ['analytics', 'stats', 'monitoring', 'dashboard']
    },
    {
      pluginId: 'chat-system', name: 'Real-Time Chat', icon: '💬',
      description: 'Global and private messaging between users and nodes.',
      category: 'communication', isSystem: true, isPublished: true, isVerified: true,
      permissions: ['network'],
      actions: [
        { name: 'sendMessage', description: 'Send a chat message', params: { message: 'string', channel: 'string' } },
        { name: 'getHistory', description: 'Get chat history', params: { channel: 'string', limit: 'number' } }
      ],
      tags: ['chat', 'messaging', 'social', 'communication']
    },
    {
      pluginId: 'security-monitor', name: 'Security Monitor', icon: '🛡️',
      description: 'Monitor node security, detect anomalies, and manage permissions.',
      category: 'security', isSystem: true, isPublished: true, isVerified: true,
      permissions: ['system', 'network'],
      actions: [
        { name: 'scanNode', description: 'Security scan a node', params: { nodeId: 'string' } },
        { name: 'getAlerts', description: 'Get security alerts', params: {} },
        { name: 'lockNode', description: 'Lock a node remotely', params: { nodeId: 'string' } }
      ],
      tags: ['security', 'monitoring', 'protection', 'firewall']
    },

    // === COMMUNITY PLUGINS (marketplace examples) ===
    {
      pluginId: 'pomodoro-timer', name: 'Pomodoro Timer', icon: '🍅',
      description: 'Focus timer with task integration. Complete pomodoro sessions to earn bonus XP.',
      category: 'productivity', isPublished: true, isVerified: true,
      permissions: ['display', 'audio'],
      actions: [
        { name: 'startSession', description: 'Start a 25-min focus session', params: {} },
        { name: 'pauseSession', description: 'Pause current session', params: {} }
      ],
      tags: ['timer', 'focus', 'productivity', 'pomodoro'], downloads: 342, rating: 4.5, ratingCount: 28
    },
    {
      pluginId: 'habit-tracker', name: 'Habit Tracker', icon: '✅',
      description: 'Track daily habits and build streaks. Integrates with the reward system.',
      category: 'productivity', isPublished: true, isVerified: true,
      permissions: ['system'],
      actions: [
        { name: 'logHabit', description: 'Log a habit completion', params: { habitName: 'string' } },
        { name: 'getStreaks', description: 'Get current streaks', params: {} }
      ],
      tags: ['habits', 'streaks', 'tracking', 'daily'], downloads: 567, rating: 4.7, ratingCount: 45
    },
    {
      pluginId: 'node-compute', name: 'Distributed Compute', icon: '⚡',
      description: 'Share compute resources across your node network. Run distributed tasks.',
      category: 'compute', isPublished: true, isPaid: true, price: 500,
      permissions: ['compute', 'network'],
      actions: [
        { name: 'submitJob', description: 'Submit a compute job', params: { script: 'string' } },
        { name: 'getResults', description: 'Get job results', params: { jobId: 'string' } }
      ],
      tags: ['compute', 'distributed', 'processing', 'gpu'], downloads: 89, rating: 4.2, ratingCount: 12
    },
    {
      pluginId: 'weather-node', name: 'Weather Station', icon: '🌤️',
      description: 'Turn your node into a weather data collector. Share environmental data.',
      category: 'utility', isPublished: true,
      permissions: ['network', 'gps'],
      actions: [
        { name: 'getWeather', description: 'Get current weather', params: { location: 'string' } },
        { name: 'setAlert', description: 'Set weather alert', params: { condition: 'string' } }
      ],
      tags: ['weather', 'environment', 'data', 'iot'], downloads: 156, rating: 3.9, ratingCount: 18
    },
    {
      pluginId: 'fitness-tracker', name: 'Fitness Integration', icon: '💪',
      description: 'Connect fitness data to earn XP. Steps, workouts, and health metrics.',
      category: 'game', isPublished: true,
      permissions: ['system'],
      actions: [
        { name: 'logWorkout', description: 'Log a workout', params: { type: 'string', duration: 'number' } },
        { name: 'syncSteps', description: 'Sync step count', params: { steps: 'number' } }
      ],
      tags: ['fitness', 'health', 'workout', 'steps'], downloads: 423, rating: 4.6, ratingCount: 38
    },
    {
      pluginId: 'code-runner', name: 'Code Runner', icon: '💻',
      description: 'Execute code snippets on remote nodes. Supports JS, Python, and shell.',
      category: 'compute', isPublished: true, isPaid: true, price: 200,
      permissions: ['compute', 'network'],
      actions: [
        { name: 'runCode', description: 'Run code on a node', params: { language: 'string', code: 'string', nodeId: 'string' } }
      ],
      tags: ['code', 'execute', 'programming', 'remote'], downloads: 234, rating: 4.3, ratingCount: 22
    }
  ];

  await Plugin.insertMany(plugins);
  console.log(`✅ Seeded ${plugins.length} plugins (${plugins.filter(p=>p.isSystem).length} system + ${plugins.filter(p=>!p.isSystem).length} community)`);
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
