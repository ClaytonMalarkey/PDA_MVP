#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const Quest = require('../models/Quest');
const IncomeGenerator = require('../models/IncomeGenerator');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // === SEED QUESTS ===
  await Quest.deleteMany({});
  const quests = [
    // DAILY
    { questId: 'daily-1', title: 'First Steps', description: 'Complete 1 task today', type: 'daily', icon: '👣',
      requirements: { tasksToComplete: 1 }, rewards: { xp: 50, currency: 25, energy: 10 }, sortOrder: 1 },
    { questId: 'daily-2', title: 'Getting Warmed Up', description: 'Complete 3 tasks today', type: 'daily', icon: '🔥',
      requirements: { tasksToComplete: 3 }, rewards: { xp: 150, currency: 75 }, sortOrder: 2 },
    { questId: 'daily-3', title: 'Productive Day', description: 'Complete 5 tasks today', type: 'daily', icon: '⚡',
      requirements: { tasksToComplete: 5 }, rewards: { xp: 300, currency: 150, influencePoints: 5 }, sortOrder: 3 },
    { questId: 'daily-4', title: 'Train Any Skill', description: 'Train a skill to level 1+', type: 'daily', icon: '🧠',
      requirements: { skillRequired: 'coding', skillLevel: 1 }, rewards: { xp: 100, currency: 50 }, sortOrder: 4 },
    // WEEKLY
    { questId: 'weekly-1', title: 'Week Warrior', description: 'Complete 20 total tasks', type: 'weekly', icon: '🗓️',
      requirements: { tasksToComplete: 20 }, rewards: { xp: 1000, currency: 500, influencePoints: 20 }, sortOrder: 1 },
    { questId: 'weekly-2', title: 'Skill Builder', description: 'Reach coding level 3', type: 'weekly', icon: '💻',
      requirements: { skillRequired: 'coding', skillLevel: 3 }, rewards: { xp: 500, currency: 250, innovationTokens: 10 }, sortOrder: 2 },
    { questId: 'weekly-3', title: 'Business Mind', description: 'Reach business level 3', type: 'weekly', icon: '📊',
      requirements: { skillRequired: 'business', skillLevel: 3 }, rewards: { xp: 500, currency: 500 }, sortOrder: 3 },
    { questId: 'weekly-4', title: 'Upgrade Your Space', description: 'Reach hub level 2', type: 'weekly', icon: '🏢',
      requirements: { hubLevel: 2 }, rewards: { xp: 800, currency: 300, energy: 50 }, sortOrder: 4 },
    // EPIC
    { questId: 'epic-1', title: 'Empire Foundation', description: 'Complete 100 tasks total', type: 'epic', icon: '🏛️',
      requirements: { tasksToComplete: 100 }, rewards: { xp: 5000, currency: 2500, influencePoints: 100, legacyStones: 10 }, sortOrder: 1 },
    { questId: 'epic-2', title: 'Tech Visionary', description: 'Reach coding level 10', type: 'epic', icon: '🚀',
      requirements: { skillRequired: 'coding', skillLevel: 10 }, rewards: { xp: 3000, innovationTokens: 50, legacyStones: 5 }, sortOrder: 2 },
    { questId: 'epic-3', title: 'Space Commander', description: 'Reach hub level 5 (Space Station)', type: 'epic', icon: '🛸',
      requirements: { hubLevel: 5 }, rewards: { xp: 10000, currency: 5000, legacyStones: 25, influencePoints: 200 }, sortOrder: 3 },
    { questId: 'epic-4', title: 'Mogul', description: 'Reach business level 10', type: 'epic', icon: '💎',
      requirements: { skillRequired: 'business', skillLevel: 10 }, rewards: { xp: 5000, currency: 10000, legacyStones: 15 }, sortOrder: 4 },
  ];
  await Quest.insertMany(quests);
  console.log(`✅ Seeded ${quests.length} quests`);

  // === SEED INCOME GENERATORS ===
  await IncomeGenerator.deleteMany({});
  const generators = [
    // Freelance (Hub 1)
    { generatorId: 'freelance-tasks', name: 'Freelance Tasks', description: 'Simple gig work', icon: '📝',
      baseCost: 100, baseIncome: 5, category: 'freelance', requiredHubLevel: 1 },
    { generatorId: 'tutoring', name: 'Online Tutoring', description: 'Teach what you know', icon: '📚',
      baseCost: 250, baseIncome: 12, category: 'freelance', requiredHubLevel: 1, requiredSkill: 'coding', requiredSkillLevel: 2 },
    // Passive (Hub 2)
    { generatorId: 'content-creation', name: 'Content Creation', description: 'Blog/video passive income', icon: '🎬',
      baseCost: 500, baseIncome: 20, category: 'passive', requiredHubLevel: 2, requiredSkill: 'creativity', requiredSkillLevel: 2 },
    { generatorId: 'digital-products', name: 'Digital Products', description: 'Sell templates & tools', icon: '💿',
      baseCost: 800, baseIncome: 30, category: 'passive', requiredHubLevel: 2, requiredSkill: 'coding', requiredSkillLevel: 3 },
    // Business (Hub 3)
    { generatorId: 'saas-app', name: 'SaaS Application', description: 'Subscription software', icon: '☁️',
      baseCost: 2000, baseIncome: 60, category: 'business', requiredHubLevel: 3, requiredSkill: 'coding', requiredSkillLevel: 5 },
    { generatorId: 'consulting', name: 'Consulting Firm', description: 'Expert advisory services', icon: '🤝',
      baseCost: 3000, baseIncome: 80, category: 'business', requiredHubLevel: 3, requiredSkill: 'business', requiredSkillLevel: 5 },
    { generatorId: 'ecommerce', name: 'E-Commerce Store', description: 'Online retail empire', icon: '🛒',
      baseCost: 2500, baseIncome: 50, category: 'business', requiredHubLevel: 3, requiredSkill: 'business', requiredSkillLevel: 3 },
    // Venture (Hub 4+)
    { generatorId: 'tech-startup', name: 'Tech Startup', description: 'High-growth venture', icon: '🦄',
      baseCost: 10000, baseIncome: 200, category: 'venture', requiredHubLevel: 4, requiredSkill: 'coding', requiredSkillLevel: 8 },
    { generatorId: 'space-mining', name: 'Space Mining Corp', description: 'Asteroid resource extraction', icon: '⛏️',
      baseCost: 25000, baseIncome: 500, category: 'venture', requiredHubLevel: 5, requiredSkill: 'spaceTech', requiredSkillLevel: 5 },
    { generatorId: 'orbital-station', name: 'Orbital Commerce Hub', description: 'Space trade station', icon: '🛰️',
      baseCost: 50000, baseIncome: 1000, category: 'venture', requiredHubLevel: 5, requiredSkill: 'spaceTech', requiredSkillLevel: 8 },
  ];
  await IncomeGenerator.insertMany(generators);
  console.log(`✅ Seeded ${generators.length} income generators`);

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
