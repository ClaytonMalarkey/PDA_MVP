#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  const ActivityFeed = require('../models/ActivityFeed');
  const User = require('../models/User');

  await ActivityFeed.deleteMany({});
  const users = await User.find({}).limit(6);
  if (users.length < 2) { console.log('Need users first'); process.exit(1); }

  const activities = [
    { userId: users[0]._id, type: 'level_up', message: 'Reached Level 25! 🎉', icon: '🎉', isGlobal: true },
    { userId: users[1]._id, type: 'task_complete', message: 'Completed 120 tasks total', icon: '✅' },
    { userId: users[0]._id, type: 'node_register', message: 'Registered new node: Command Center', icon: '🖥️' },
    { userId: users[2]._id, type: 'join_alliance', message: 'Joined Earth Guardians alliance', icon: '🤝' },
    { userId: users[0]._id, type: 'plugin_install', message: 'Installed Remote Control on Command Center', icon: '🔌' },
    { userId: users[3]._id, type: 'streak_milestone', message: '30-day streak! 🔥', icon: '🔥' },
    { userId: users[0]._id, type: 'research_complete', message: 'Completed 15 research nodes in Personal Discipline', icon: '🔬' },
    { userId: users[1]._id, type: 'structure_build', message: 'Built Training Grounds (Level 3)', icon: '🏗️' },
    { userId: users[4]._id, type: 'achievement', message: 'Unlocked "First Blood" achievement', icon: '🏆' },
    { userId: users[0]._id, type: 'plugin_publish', message: 'Published plugin: Pomodoro Timer', icon: '📦', isGlobal: true },
    { userId: users[2]._id, type: 'purchase', message: 'Purchased Explorer Pack', icon: '💰' },
    { userId: users[3]._id, type: 'challenge_win', message: 'Won PvP challenge against player2!', icon: '⚔️' },
    { userId: users[1]._id, type: 'guild_join', message: 'Joined Builders Guild', icon: '⚔️' },
    { userId: users[0]._id, type: 'node_register', message: 'Registered mobile node: Phone Alpha', icon: '📱' },
    { userId: users[5]._id, type: 'level_up', message: 'Reached Level 22! Premium player on fire!', icon: '🎉' },
    { userId: null, type: 'system', message: 'Server maintenance completed. All systems operational.', icon: '📢', isGlobal: true },
    { userId: users[0]._id, type: 'project_contribute', message: 'Contributed to Global Clean Energy project', icon: '🌍' },
    { userId: users[4]._id, type: 'task_complete', message: 'Completed "Study orbital mechanics" task', icon: '✅' },
    { userId: users[3]._id, type: 'research_complete', message: 'Unlocked Economic Growth Tier 3', icon: '🔬' },
    { userId: users[1]._id, type: 'friend_add', message: 'Became friends with player3', icon: '👥' },
  ];

  // Stagger timestamps
  const now = Date.now();
  const docs = activities.map((a, i) => ({
    ...a,
    isPublic: true,
    createdAt: new Date(now - i * 3600000), // 1 hour apart
    updatedAt: new Date(now - i * 3600000)
  }));

  await ActivityFeed.insertMany(docs);
  console.log(`✅ Seeded ${docs.length} activity feed entries`);
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
