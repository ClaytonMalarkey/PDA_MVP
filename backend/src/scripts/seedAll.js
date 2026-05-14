#!/usr/bin/env node
/**
 * Master Seed Script — Populates ALL MongoDB collections with dummy data
 * Run: node src/scripts/seedAll.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB\n');

  // === 1. USERS ===
  const User = require('../models/User');
  await User.deleteMany({});
  const passwordHash = await bcrypt.hash('Password123!', 10);
  const adminHash = await bcrypt.hash('Admin123!', 10);
  const users = [
    { email:'admin@spaceout.com', passwordHash:adminHash, role:'admin', xp:50000, rank:25, currency:100000, streak:45, influencePoints:500, innovationTokens:200, legacyStones:50, knowledgePoints:1000, globalMultiplier:1.15, hubLevel:4, skills:{coding:8,business:6,fitness:5,creativity:4,survival:3,spaceTech:7}, incomePerHour:250, totalTasksCompleted:500, energy:300, maxEnergy:300 },
    { email:'player1@test.com', passwordHash, xp:12000, rank:10, currency:5000, streak:12, influencePoints:100, innovationTokens:30, legacyStones:5, knowledgePoints:200, hubLevel:3, skills:{coding:5,business:3,fitness:4,creativity:2,survival:1,spaceTech:2}, totalTasksCompleted:120, energy:200, maxEnergy:200 },
    { email:'player2@test.com', passwordHash, xp:8000, rank:7, currency:3000, streak:7, influencePoints:50, innovationTokens:15, legacyStones:2, knowledgePoints:100, hubLevel:2, skills:{coding:2,business:5,fitness:3,creativity:4,survival:2,spaceTech:1}, totalTasksCompleted:80, energy:150, maxEnergy:150 },
    { email:'player3@test.com', passwordHash, xp:25000, rank:15, currency:15000, streak:30, influencePoints:200, innovationTokens:80, legacyStones:15, knowledgePoints:500, hubLevel:4, skills:{coding:7,business:7,fitness:6,creativity:5,survival:4,spaceTech:5}, totalTasksCompleted:300, energy:300, maxEnergy:300 },
    { email:'player4@test.com', passwordHash, xp:3000, rank:4, currency:800, streak:3, influencePoints:20, innovationTokens:5, legacyStones:0, knowledgePoints:50, hubLevel:1, skills:{coding:1,business:1,fitness:2,creativity:1,survival:1,spaceTech:0}, totalTasksCompleted:30, energy:100, maxEnergy:100 },
    { email:'player5@test.com', passwordHash, xp:45000, rank:22, currency:50000, streak:60, influencePoints:400, innovationTokens:150, legacyStones:30, knowledgePoints:800, hubLevel:5, skills:{coding:9,business:8,fitness:7,creativity:6,survival:5,spaceTech:8}, totalTasksCompleted:600, energy:500, maxEnergy:500, isPremium:true, premiumExpiresAt:new Date('2027-01-01') },
  ];
  const savedUsers = await User.insertMany(users);
  console.log('✅ Users:', savedUsers.length);

  // === 2. CATEGORIES ===
  const Category = require('../models/Category');
  await Category.deleteMany({});
  const cats = [
    { name:'Critical Thinking', icon:'🧠', color:'#8b5cf6', description:'Question everything', isDefault:true },
    { name:'Sound Money', icon:'💰', color:'#f59e0b', description:'Financial literacy', isDefault:true },
    { name:'Self-Reliance', icon:'🏋️', color:'#10b981', description:'Practical skills', isDefault:true },
    { name:'Accountability', icon:'⚖️', color:'#ef4444', description:'Personal discipline', isDefault:true },
    { name:'Space Expansion', icon:'🚀', color:'#3b82f6', description:'Humanity among the stars', isDefault:true },
    { name:'Physical Mastery', icon:'💪', color:'#f97316', description:'Body optimization', isDefault:true },
    { name:'Community Building', icon:'🤝', color:'#14b8a6', description:'Strengthen local networks', isDefault:true },
    { name:'Technology', icon:'💻', color:'#6366f1', description:'Build and automate', isDefault:true },
    { name:'Governance', icon:'🏛️', color:'#d97706', description:'Ethics and freedom', isDefault:true },
    { name:'Creative Expression', icon:'🎨', color:'#ec4899', description:'Art and invention', isDefault:true },
  ];
  await Category.insertMany(cats);
  console.log('✅ Categories:', cats.length);

  // === 3. TASKS (sample static tasks) ===
  const Task = require('../models/Task');
  await Task.deleteMany({});
  const tasks = [];
  const taskTitles = ['Analyze a news article','Track your budget','Learn first aid','Do 50 pushups','Study orbital mechanics','Write a short story','Help a neighbor','Code a script','Debate governance','Plant a seed'];
  for (let i = 0; i < 50; i++) {
    tasks.push({ taskId:'task-'+i, title:taskTitles[i%10]+' #'+(i+1), description:'Complete this task to earn rewards and advance humanity.', category:cats[i%10].name, xpReward:20+i*5, currencyReward:10+i*3, cooldown:3600000, isActive:true, realReward:i%7===0?'Skill badge':null });
  }
  await Task.insertMany(tasks);
  console.log('✅ Tasks:', tasks.length);

  // === 4. USER TASKS ===
  const UserTask = require('../models/UserTask');
  await UserTask.deleteMany({});
  const userTasks = [];
  for (let i = 0; i < 20; i++) {
    userTasks.push({ userId:savedUsers[1]._id, taskId:'task-'+i, status:'completed', xpAwarded:tasks[i].xpReward, currencyAwarded:tasks[i].currencyReward, completedAt:new Date(Date.now()-i*86400000) });
  }
  await UserTask.insertMany(userTasks);
  console.log('✅ UserTasks:', userTasks.length);

  // === 5. STRUCTURES ===
  const Structure = require('../models/Structure');
  await Structure.deleteMany({});
  const structs = [
    { structureId:'library', name:'Library', description:'Boosts research speed', baseCost:100, baseProduction:5, icon:'📚' },
    { structureId:'training-grounds', name:'Training Grounds', description:'Boosts physical rewards', baseCost:150, baseProduction:8, icon:'🏋️' },
    { structureId:'research-lab', name:'Research Lab', description:'Unlocks research tree', baseCost:200, baseProduction:10, icon:'🔬' },
    { structureId:'trade-hub', name:'Trade Hub', description:'Currency generation', baseCost:250, baseProduction:12, icon:'🏪' },
    { structureId:'solar-array', name:'Solar Array', description:'Energy production', baseCost:300, baseProduction:15, icon:'☀️' },
    { structureId:'comm-tower', name:'Comm Tower', description:'Social bonuses', baseCost:180, baseProduction:7, icon:'📡' },
  ];
  await Structure.insertMany(structs);
  console.log('✅ Structures:', structs.length);

  // === 6. USER STRUCTURES ===
  const UserStructure = require('../models/UserStructure');
  await UserStructure.deleteMany({});
  const userStructs = [
    { userId:savedUsers[0]._id, structureId:'library', level:5 },
    { userId:savedUsers[0]._id, structureId:'research-lab', level:3 },
    { userId:savedUsers[0]._id, structureId:'trade-hub', level:4 },
    { userId:savedUsers[1]._id, structureId:'library', level:2 },
    { userId:savedUsers[1]._id, structureId:'training-grounds', level:3 },
    { userId:savedUsers[2]._id, structureId:'trade-hub', level:2 },
    { userId:savedUsers[3]._id, structureId:'library', level:4 },
    { userId:savedUsers[3]._id, structureId:'research-lab', level:5 },
    { userId:savedUsers[3]._id, structureId:'solar-array', level:3 },
    { userId:savedUsers[5]._id, structureId:'library', level:8 },
    { userId:savedUsers[5]._id, structureId:'research-lab', level:7 },
    { userId:savedUsers[5]._id, structureId:'trade-hub', level:6 },
    { userId:savedUsers[5]._id, structureId:'solar-array', level:5 },
  ];
  await UserStructure.insertMany(userStructs);
  console.log('✅ UserStructures:', userStructs.length);

  // === 7. TRANSACTIONS ===
  const Transaction = require('../models/Transaction');
  await Transaction.deleteMany({});
  const txns = [];
  for (let i = 0; i < 30; i++) {
    txns.push({ userId:savedUsers[i%5]._id, type:['task_reward','structure_purchase','idle_income','payment'][i%4], amount:50+i*10, currency:['xp','currency','xp','currency'][i%4], metadata:{source:'seed'} });
  }
  await Transaction.insertMany(txns);
  console.log('✅ Transactions:', txns.length);

  // === 8. CIVILIZATIONS ===
  const Civilization = require('../models/Civilization');
  await Civilization.deleteMany({});
  const civs = [
    { name:'Solar Pioneers', leaderId:savedUsers[0]._id, members:[savedUsers[0]._id,savedUsers[1]._id,savedUsers[2]._id], governanceType:'meritocratic', stabilityScore:92, totalResources:5000, researchLevel:5, territoryCount:3, icon:'🚀' },
    { name:'Earth Guardians', leaderId:savedUsers[3]._id, members:[savedUsers[3]._id,savedUsers[4]._id], governanceType:'democratic', stabilityScore:85, totalResources:3000, researchLevel:3, territoryCount:2, icon:'🌍' },
    { name:'Void Walkers', leaderId:savedUsers[5]._id, members:[savedUsers[5]._id], governanceType:'technocratic', stabilityScore:95, totalResources:10000, researchLevel:8, territoryCount:5, icon:'🌌' },
  ];
  const savedCivs = await Civilization.insertMany(civs);
  // Update users with civilizationId
  await User.updateOne({_id:savedUsers[0]._id},{civilizationId:savedCivs[0]._id});
  await User.updateOne({_id:savedUsers[1]._id},{civilizationId:savedCivs[0]._id});
  await User.updateOne({_id:savedUsers[2]._id},{civilizationId:savedCivs[0]._id});
  await User.updateOne({_id:savedUsers[3]._id},{civilizationId:savedCivs[1]._id});
  await User.updateOne({_id:savedUsers[4]._id},{civilizationId:savedCivs[1]._id});
  await User.updateOne({_id:savedUsers[5]._id},{civilizationId:savedCivs[2]._id});
  console.log('✅ Civilizations:', civs.length);

  // === 9. RESEARCH NODES (already seeded by seedResearchTree.js, skip if exists) ===
  const ResearchNode = require('../models/ResearchNode');
  const rnCount = await ResearchNode.countDocuments();
  if (rnCount === 0) { console.log('⚠️  ResearchNodes empty — run: node src/scripts/seedResearchTree.js'); }
  else { console.log('✅ ResearchNodes:', rnCount, '(existing)'); }

  // === 10. RESEARCH PROGRESS ===
  const ResearchProgress = require('../models/ResearchProgress');
  await ResearchProgress.deleteMany({});
  const rps = [];
  for (let i = 0; i < 15; i++) {
    rps.push({ userId:savedUsers[0]._id, nodeId:'PD-'+String(i+1).padStart(3,'0'), isCompleted:true, completedAt:new Date() });
  }
  for (let i = 0; i < 8; i++) {
    rps.push({ userId:savedUsers[3]._id, nodeId:'EG-'+String(i+1).padStart(3,'0'), isCompleted:true, completedAt:new Date() });
  }
  await ResearchProgress.insertMany(rps);
  console.log('✅ ResearchProgress:', rps.length);

  // === 11. QUESTS ===
  const Quest = require('../models/Quest');
  const qCount = await Quest.countDocuments();
  if (qCount === 0) { console.log('⚠️  Quests empty — run: node src/scripts/seedGameplay.js'); }
  else { console.log('✅ Quests:', qCount, '(existing)'); }

  // === 12. USER QUESTS ===
  const UserQuest = require('../models/UserQuest');
  await UserQuest.deleteMany({});
  const uqs = [
    { userId:savedUsers[0]._id, questId:'daily-1', progress:1, isCompleted:true, completedAt:new Date() },
    { userId:savedUsers[0]._id, questId:'daily-2', progress:3, isCompleted:true, completedAt:new Date() },
    { userId:savedUsers[0]._id, questId:'weekly-1', progress:20, isCompleted:true, completedAt:new Date() },
    { userId:savedUsers[1]._id, questId:'daily-1', progress:1, isCompleted:true, completedAt:new Date() },
  ];
  await UserQuest.insertMany(uqs);
  console.log('✅ UserQuests:', uqs.length);

  // === 13. INCOME GENERATORS ===
  const IncomeGenerator = require('../models/IncomeGenerator');
  const igCount = await IncomeGenerator.countDocuments();
  if (igCount === 0) { console.log('⚠️  IncomeGenerators empty — run: node src/scripts/seedGameplay.js'); }
  else { console.log('✅ IncomeGenerators:', igCount, '(existing)'); }

  // === 14. USER GENERATORS ===
  const UserGenerator = require('../models/UserGenerator');
  await UserGenerator.deleteMany({});
  const ugs = [
    { userId:savedUsers[0]._id, generatorId:'freelance-tasks', level:5, isAutomated:true },
    { userId:savedUsers[0]._id, generatorId:'tutoring', level:3, isAutomated:false },
    { userId:savedUsers[0]._id, generatorId:'saas-app', level:2, isAutomated:true },
    { userId:savedUsers[1]._id, generatorId:'freelance-tasks', level:3, isAutomated:false },
    { userId:savedUsers[3]._id, generatorId:'freelance-tasks', level:4, isAutomated:true },
    { userId:savedUsers[3]._id, generatorId:'consulting', level:2, isAutomated:false },
    { userId:savedUsers[5]._id, generatorId:'tech-startup', level:3, isAutomated:true },
    { userId:savedUsers[5]._id, generatorId:'space-mining', level:1, isAutomated:false },
  ];
  await UserGenerator.insertMany(ugs);
  console.log('✅ UserGenerators:', ugs.length);

  // === 15. SHOP ITEMS ===
  const ShopItem = require('../models/ShopItem');
  await ShopItem.deleteMany({});
  const shopItems = [
    { itemId:'credits-500', name:'Starter Pack', description:'500 credits to get going', icon:'💰', category:'currency_pack', priceUSD:0.99, rewards:{currency:500}, sortOrder:1 },
    { itemId:'credits-2500', name:'Explorer Pack', description:'2,500 credits + 50 XP bonus', icon:'💎', category:'currency_pack', priceUSD:4.99, rewards:{currency:2500,xp:50}, sortOrder:2, isFeatured:true },
    { itemId:'credits-7500', name:'Commander Pack', description:'7,500 credits + 200 XP + 10 IP', icon:'👑', category:'currency_pack', priceUSD:9.99, rewards:{currency:7500,xp:200,influencePoints:10}, sortOrder:3 },
    { itemId:'credits-20000', name:'Emperor Pack', description:'20,000 credits + 500 XP + 25 IP + 5 LS', icon:'🏆', category:'currency_pack', priceUSD:19.99, rewards:{currency:20000,xp:500,influencePoints:25,legacyStones:5}, sortOrder:4 },
    { itemId:'premium-7', name:'Premium Week', description:'7 days: No ads, 1.5x rewards', icon:'⭐', category:'premium', priceUSD:1.99, rewards:{premiumDays:7}, sortOrder:1 },
    { itemId:'premium-30', name:'Premium Month', description:'30 days premium — best value', icon:'🌟', category:'premium', priceUSD:4.99, rewards:{premiumDays:30}, sortOrder:2, isFeatured:true },
    { itemId:'premium-365', name:'Premium Year', description:'365 days premium + 5000 credits', icon:'💫', category:'premium', priceUSD:39.99, rewards:{premiumDays:365,currency:5000}, sortOrder:3 },
    { itemId:'boost-xp', name:'XP Surge', description:'+500 XP instantly', icon:'⚡', category:'booster', priceCurrency:200, rewards:{xp:500}, sortOrder:1 },
    { itemId:'boost-energy', name:'Energy Recharge', description:'Full energy refill', icon:'🔋', category:'booster', priceCurrency:100, rewards:{energy:500}, sortOrder:2 },
    { itemId:'boost-ip', name:'Influence Boost', description:'+25 Influence Points', icon:'📢', category:'booster', priceCurrency:300, rewards:{influencePoints:25}, sortOrder:3 },
    { itemId:'boost-it', name:'Innovation Surge', description:'+15 Innovation Tokens', icon:'🔬', category:'booster', priceCurrency:250, rewards:{innovationTokens:15}, sortOrder:4 },
    { itemId:'boost-ls', name:'Legacy Stone', description:'+5 Legacy Stones', icon:'🏛️', category:'booster', priceCurrency:500, rewards:{legacyStones:5}, sortOrder:5 },
    { itemId:'energy-small', name:'Small Battery', description:'+50 energy', icon:'🔋', category:'energy', priceCurrency:50, rewards:{energy:50}, sortOrder:1 },
    { itemId:'energy-large', name:'Power Cell', description:'+150 energy', icon:'⚡', category:'energy', priceCurrency:120, rewards:{energy:150}, sortOrder:2 },
    { itemId:'energy-mega', name:'Reactor Core', description:'Full energy + max energy +25', icon:'☢️', category:'energy', priceUSD:0.99, rewards:{energy:999}, sortOrder:3 },
  ];
  await ShopItem.insertMany(shopItems);
  console.log('✅ ShopItems:', shopItems.length);

  // === 16. PURCHASES ===
  const Purchase = require('../models/Purchase');
  await Purchase.deleteMany({});
  const purchases = [
    { userId:savedUsers[0]._id, itemId:'boost-xp', paymentMethod:'in_game', amountPaid:200, currencyType:'credits' },
    { userId:savedUsers[0]._id, itemId:'credits-2500', paymentMethod:'stripe', amountPaid:4.99, currencyType:'usd' },
    { userId:savedUsers[1]._id, itemId:'boost-energy', paymentMethod:'in_game', amountPaid:100, currencyType:'credits' },
    { userId:savedUsers[5]._id, itemId:'premium-30', paymentMethod:'stripe', amountPaid:4.99, currencyType:'usd' },
    { userId:savedUsers[3]._id, itemId:'ad_currency', paymentMethod:'ad_reward', amountPaid:0, currencyType:'free' },
  ];
  await Purchase.insertMany(purchases);
  console.log('✅ Purchases:', purchases.length);

  // === 17. SOCIAL: Friends, Chat, Activity, Challenges, Gifts, Achievements, DailyLogins ===
  const { Friend, Chat, Activity, Challenge, Gift, Achievement, UserAchievement, DailyLogin } = require('../models/Social');

  await Friend.deleteMany({});
  const friends = [
    { userId:savedUsers[0]._id, friendId:savedUsers[1]._id, status:'accepted' },
    { userId:savedUsers[1]._id, friendId:savedUsers[0]._id, status:'accepted' },
    { userId:savedUsers[0]._id, friendId:savedUsers[3]._id, status:'accepted' },
    { userId:savedUsers[3]._id, friendId:savedUsers[0]._id, status:'accepted' },
    { userId:savedUsers[2]._id, friendId:savedUsers[4]._id, status:'pending' },
  ];
  await Friend.insertMany(friends);
  console.log('✅ Friends:', friends.length);

  await Chat.deleteMany({});
  const chats = [
    { senderId:savedUsers[0]._id, message:'Welcome to Space Out! Ready to build our empire?' },
    { senderId:savedUsers[1]._id, message:'Just completed my first 10 tasks! 🔥' },
    { senderId:savedUsers[3]._id, message:'Anyone want to join Earth Guardians alliance?' },
    { senderId:savedUsers[5]._id, message:'Hit level 22 today. The grind is real.' },
    { senderId:savedUsers[2]._id, message:'Sound money principles are changing my life.' },
    { senderId:savedUsers[0]._id, message:'New research node unlocked! +5% global multiplier.' },
  ];
  await Chat.insertMany(chats);
  console.log('✅ Chats:', chats.length);

  await Activity.deleteMany({});
  const activities = [
    { userId:savedUsers[0]._id, type:'level_up', message:'Reached Level 25! 🎉', isPublic:true },
    { userId:savedUsers[1]._id, type:'task_complete', message:'Completed 120 tasks total', isPublic:true },
    { userId:savedUsers[3]._id, type:'join_alliance', message:'Joined Earth Guardians', isPublic:true },
    { userId:savedUsers[5]._id, type:'streak_milestone', message:'60-day streak! 🔥', isPublic:true },
    { userId:savedUsers[0]._id, type:'research', message:'Completed 15 research nodes', isPublic:true },
    { userId:savedUsers[2]._id, type:'build', message:'Built first structure', isPublic:true },
    { userId:savedUsers[4]._id, type:'daily_login', message:'Day 3 login reward claimed', isPublic:true },
  ];
  await Activity.insertMany(activities);
  console.log('✅ Activities:', activities.length);

  await Challenge.deleteMany({});
  const challenges = [
    { challengerId:savedUsers[0]._id, targetId:savedUsers[1]._id, type:'tasks', goal:10, wager:100, status:'active', expiresAt:new Date(Date.now()+86400000) },
    { challengerId:savedUsers[3]._id, targetId:savedUsers[5]._id, type:'xp', goal:1000, wager:500, status:'active', expiresAt:new Date(Date.now()+172800000) },
    { challengerId:savedUsers[1]._id, targetId:savedUsers[2]._id, type:'kills', goal:20, wager:50, status:'pending', expiresAt:new Date(Date.now()+86400000) },
  ];
  await Challenge.insertMany(challenges);
  console.log('✅ Challenges:', challenges.length);

  await Gift.deleteMany({});
  const gifts = [
    { senderId:savedUsers[0]._id, receiverId:savedUsers[1]._id, type:'credits', amount:100, claimed:false },
    { senderId:savedUsers[3]._id, receiverId:savedUsers[4]._id, type:'energy', amount:50, claimed:false },
    { senderId:savedUsers[5]._id, receiverId:savedUsers[0]._id, type:'credits', amount:500, claimed:false },
  ];
  await Gift.insertMany(gifts);
  console.log('✅ Gifts:', gifts.length);

  // Achievements (already seeded by seedSocial.js)
  const achCount = await Achievement.countDocuments();
  if (achCount === 0) { console.log('⚠️  Achievements empty — run: node src/scripts/seedSocial.js'); }
  else { console.log('✅ Achievements:', achCount, '(existing)'); }

  await UserAchievement.deleteMany({});
  const uachs = [
    { userId:savedUsers[0]._id, achievementId:'first-blood' },
    { userId:savedUsers[0]._id, achievementId:'hunter-10' },
    { userId:savedUsers[0]._id, achievementId:'slayer-50' },
    { userId:savedUsers[0]._id, achievementId:'first-crystal' },
    { userId:savedUsers[0]._id, achievementId:'streak-7' },
    { userId:savedUsers[0]._id, achievementId:'streak-30' },
    { userId:savedUsers[0]._id, achievementId:'rich-1k' },
    { userId:savedUsers[0]._id, achievementId:'rich-10k' },
    { userId:savedUsers[0]._id, achievementId:'level-5' },
    { userId:savedUsers[0]._id, achievementId:'level-10' },
    { userId:savedUsers[1]._id, achievementId:'first-blood' },
    { userId:savedUsers[1]._id, achievementId:'first-crystal' },
    { userId:savedUsers[1]._id, achievementId:'streak-3' },
    { userId:savedUsers[3]._id, achievementId:'first-blood' },
    { userId:savedUsers[3]._id, achievementId:'hunter-10' },
    { userId:savedUsers[3]._id, achievementId:'streak-7' },
    { userId:savedUsers[3]._id, achievementId:'alliance-member' },
    { userId:savedUsers[5]._id, achievementId:'first-blood' },
    { userId:savedUsers[5]._id, achievementId:'slayer-50' },
    { userId:savedUsers[5]._id, achievementId:'destroyer' },
    { userId:savedUsers[5]._id, achievementId:'streak-30' },
    { userId:savedUsers[5]._id, achievementId:'rich-10k' },
    { userId:savedUsers[5]._id, achievementId:'level-10' },
  ];
  await UserAchievement.insertMany(uachs);
  console.log('✅ UserAchievements:', uachs.length);

  await DailyLogin.deleteMany({});
  const dls = [];
  for (let d = 1; d <= 7; d++) {
    dls.push({ userId:savedUsers[0]._id, day:d, claimedAt:new Date(Date.now()-(7-d)*86400000) });
  }
  for (let d = 1; d <= 3; d++) {
    dls.push({ userId:savedUsers[1]._id, day:d, claimedAt:new Date(Date.now()-(3-d)*86400000) });
  }
  await DailyLogin.insertMany(dls);
  console.log('✅ DailyLogins:', dls.length);

  // === 18. GAME CONFIG ===
  const GameConfig = require('../models/GameConfig');
  const gcCount = await GameConfig.countDocuments();
  if (gcCount === 0) { console.log('⚠️  GameConfig empty — run: node src/scripts/seedGameConfig.js'); }
  else { console.log('✅ GameConfigs:', gcCount, '(existing)'); }

  // === SUMMARY ===
  console.log('\n========================================');
  console.log('🎉 ALL COLLECTIONS SEEDED SUCCESSFULLY');
  console.log('========================================');
  console.log('\nLogin credentials:');
  console.log('  Admin:   admin@spaceout.com / Admin123!');
  console.log('  Player1: player1@test.com / Password123!');
  console.log('  Player2: player2@test.com / Password123!');
  console.log('  Player3: player3@test.com / Password123!');
  console.log('  Player4: player4@test.com / Password123!');
  console.log('  Player5: player5@test.com / Password123! (Premium)');
  console.log('========================================\n');

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch(e => { console.error('Seed failed:', e); process.exit(1); });
