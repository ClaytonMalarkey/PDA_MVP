#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);

  const GlobalProject = require('../models/GlobalProject');
  await GlobalProject.deleteMany({});
  const projects = [
    // Stage 1: Local
    { projectId:'local-library', name:'Community Library', description:'Build a shared knowledge repository for your local area', icon:'📚', category:'education', stage:1, goalAmount:5000, rewardXP:2000, rewardCurrency:1000 },
    { projectId:'local-garden', name:'Community Garden', description:'Create a shared food growing space', icon:'🌱', category:'health', stage:1, goalAmount:3000, rewardXP:1500, rewardCurrency:750 },
    { projectId:'local-workshop', name:'Maker Workshop', description:'Build a shared workshop with tools for everyone', icon:'🔧', category:'infrastructure', stage:1, goalAmount:8000, rewardXP:3000, rewardCurrency:1500 },
    // Stage 2: City
    { projectId:'city-solar', name:'Solar Grid', description:'Fund a city-wide renewable energy network', icon:'☀️', category:'infrastructure', stage:2, goalAmount:25000, rewardXP:8000, rewardCurrency:4000 },
    { projectId:'city-school', name:'Free Academy', description:'Establish a free education center', icon:'🏫', category:'education', stage:2, goalAmount:20000, rewardXP:6000, rewardCurrency:3000 },
    { projectId:'city-lab', name:'Research Lab', description:'Build a public research laboratory', icon:'🔬', category:'research', stage:2, goalAmount:30000, rewardXP:10000, rewardCurrency:5000 },
    // Stage 3: National
    { projectId:'national-network', name:'Mesh Network', description:'Create a decentralized communication network', icon:'📡', category:'infrastructure', stage:3, goalAmount:100000, rewardXP:25000, rewardCurrency:12000 },
    { projectId:'national-health', name:'Health Initiative', description:'Fund nationwide preventive health programs', icon:'🏥', category:'health', stage:3, goalAmount:80000, rewardXP:20000, rewardCurrency:10000 },
    // Stage 4: Global
    { projectId:'global-ai', name:'Open AI Research', description:'Fund open-source AI for humanity', icon:'🤖', category:'research', stage:4, goalAmount:500000, rewardXP:100000, rewardCurrency:50000 },
    { projectId:'global-economy', name:'Sound Money System', description:'Build a global ethical economic framework', icon:'💰', category:'economy', stage:4, goalAmount:750000, rewardXP:150000, rewardCurrency:75000 },
    // Stage 5: Space
    { projectId:'space-station', name:'Orbital Station', description:'Fund humanity\'s first civilian space station', icon:'🛸', category:'space', stage:5, goalAmount:2000000, rewardXP:500000, rewardCurrency:250000 },
    { projectId:'mars-colony', name:'Mars Colony', description:'Establish the first permanent Mars settlement', icon:'🔴', category:'space', stage:5, goalAmount:5000000, rewardXP:1000000, rewardCurrency:500000 },
  ];
  // Add some progress to early projects
  projects[0].currentAmount = 2300;
  projects[1].currentAmount = 1800;
  projects[2].currentAmount = 4500;
  projects[3].currentAmount = 8000;
  await GlobalProject.insertMany(projects);
  console.log('✅ GlobalProjects:', projects.length);

  const Guild = require('../models/Guild');
  await Guild.deleteMany({});
  const User = require('../models/User');
  const users = await User.find().limit(6);
  if (users.length >= 3) {
    const guilds = [
      { guildId:'star-builders', name:'Star Builders', specialization:'builders', icon:'🏗️', leaderId:users[0]._id, members:[users[0]._id, users[1]._id], level:3, xp:1500, description:'We build the future', bonusMultiplier:1.04 },
      { guildId:'void-scientists', name:'Void Scientists', specialization:'scientists', icon:'🔬', leaderId:users[2]._id, members:[users[2]._id], level:1, xp:300, description:'Research is our weapon', bonusMultiplier:1.02 },
      { guildId:'iron-warriors', name:'Iron Warriors', specialization:'warriors', icon:'⚔️', leaderId:users.length>3?users[3]._id:users[0]._id, members:users.length>3?[users[3]._id]:[users[0]._id], level:2, xp:800, description:'Defend humanity', bonusMultiplier:1.02 },
    ];
    await Guild.insertMany(guilds);
    console.log('✅ Guilds:', guilds.length);
  }

  const Avatar = require('../models/Avatar');
  await Avatar.deleteMany({});
  if (users.length >= 3) {
    const avatars = [
      { userId:users[0]._id, title:'Architect', frame:'gold', reputation:500, contributionScore:2500, lifetimeXP:50000, lifetimeCredits:100000, lifetimeTasks:500, lifetimeKills:200, unlockedTitles:['Newcomer','Apprentice','Journeyman','Specialist','Master','Builder','Architect'], unlockedFrames:['basic','silver','gold'] },
      { userId:users[1]._id, title:'Journeyman', frame:'silver', reputation:100, contributionScore:300, lifetimeXP:12000, lifetimeCredits:5000, lifetimeTasks:120, lifetimeKills:50, unlockedTitles:['Newcomer','Apprentice','Journeyman'], unlockedFrames:['basic','silver'] },
      { userId:users[2]._id, title:'Specialist', frame:'basic', reputation:200, contributionScore:600, lifetimeXP:8000, lifetimeCredits:3000, lifetimeTasks:80, lifetimeKills:30, unlockedTitles:['Newcomer','Apprentice','Journeyman','Specialist'], unlockedFrames:['basic'] },
    ];
    await Avatar.insertMany(avatars);
    console.log('✅ Avatars:', avatars.length);
  }

  await mongoose.connection.close();
  console.log('\n🎉 Expansion data seeded!');
  process.exit(0);
}
seed().catch(e => { console.error(e); process.exit(1); });
