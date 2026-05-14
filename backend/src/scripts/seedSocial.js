#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const { Achievement } = require('../models/Social');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  await Achievement.deleteMany({});

  const achievements = [
    // Combat
    { achievementId:'first-blood', name:'First Blood', description:'Kill your first enemy', icon:'⚔️', category:'combat', requirement:'kills>=1', rewardXP:50, rewardCurrency:25, rarity:'common' },
    { achievementId:'hunter-10', name:'Hunter', description:'Kill 10 enemies', icon:'🎯', category:'combat', requirement:'kills>=10', rewardXP:200, rewardCurrency:100, rarity:'common' },
    { achievementId:'slayer-50', name:'Slayer', description:'Kill 50 enemies', icon:'💀', category:'combat', requirement:'kills>=50', rewardXP:500, rewardCurrency:250, rarity:'uncommon' },
    { achievementId:'boss-killer', name:'Boss Killer', description:'Kill your first boss', icon:'👹', category:'combat', requirement:'boss_kills>=1', rewardXP:300, rewardCurrency:150, rarity:'uncommon' },
    { achievementId:'destroyer', name:'Destroyer', description:'Kill 100 enemies', icon:'🔥', category:'combat', requirement:'kills>=100', rewardXP:1000, rewardCurrency:500, rarity:'rare' },
    { achievementId:'legend', name:'Legend', description:'Kill 500 enemies', icon:'⭐', category:'combat', requirement:'kills>=500', rewardXP:5000, rewardCurrency:2500, rarity:'legendary' },
    // Exploration
    { achievementId:'first-crystal', name:'Shiny!', description:'Collect your first crystal', icon:'💎', category:'exploration', requirement:'crystals>=1', rewardXP:30, rewardCurrency:15, rarity:'common' },
    { achievementId:'collector-25', name:'Collector', description:'Collect 25 crystals', icon:'💎', category:'exploration', requirement:'crystals>=25', rewardXP:200, rewardCurrency:100, rarity:'common' },
    { achievementId:'miner-10', name:'Miner', description:'Mine 10 asteroids', icon:'⛏️', category:'exploration', requirement:'ore>=10', rewardXP:200, rewardCurrency:100, rarity:'common' },
    { achievementId:'rare-find', name:'Rare Find', description:'Find rare ore', icon:'✨', category:'exploration', requirement:'rare_ore>=1', rewardXP:300, rewardCurrency:200, rarity:'uncommon' },
    { achievementId:'portal-master', name:'Portal Master', description:'Enter 10 portals', icon:'🌀', category:'exploration', requirement:'portals>=10', rewardXP:500, rewardCurrency:250, rarity:'rare' },
    // Building
    { achievementId:'first-station', name:'Architect', description:'Build your first station', icon:'🏗️', category:'building', requirement:'structures>=1', rewardXP:100, rewardCurrency:50, rarity:'common' },
    { achievementId:'builder-10', name:'Builder', description:'Build 10 stations', icon:'🏛️', category:'building', requirement:'structures>=10', rewardXP:500, rewardCurrency:250, rarity:'uncommon' },
    { achievementId:'empire-builder', name:'Empire Builder', description:'Build 25 stations', icon:'🌆', category:'building', requirement:'structures>=25', rewardXP:1000, rewardCurrency:500, rarity:'rare' },
    // Streak
    { achievementId:'streak-3', name:'Getting Started', description:'3-day login streak', icon:'🔥', category:'streak', requirement:'streak>=3', rewardXP:100, rewardCurrency:50, rarity:'common' },
    { achievementId:'streak-7', name:'Week Warrior', description:'7-day login streak', icon:'🔥', category:'streak', requirement:'streak>=7', rewardXP:300, rewardCurrency:150, rarity:'uncommon' },
    { achievementId:'streak-30', name:'Dedicated', description:'30-day login streak', icon:'🔥', category:'streak', requirement:'streak>=30', rewardXP:2000, rewardCurrency:1000, rarity:'epic' },
    // Wealth
    { achievementId:'rich-1000', name:'Thousandaire', description:'Earn 1,000 credits', icon:'💰', category:'wealth', requirement:'credits>=1000', rewardXP:200, rewardCurrency:100, rarity:'common' },
    { achievementId:'rich-10000', name:'Mogul', description:'Earn 10,000 credits', icon:'💰', category:'wealth', requirement:'credits>=10000', rewardXP:1000, rewardCurrency:500, rarity:'rare' },
    { achievementId:'rich-100000', name:'Tycoon', description:'Earn 100,000 credits', icon:'👑', category:'wealth', requirement:'credits>=100000', rewardXP:5000, rewardCurrency:2500, rarity:'legendary' },
    // Social
    { achievementId:'first-friend', name:'Social Butterfly', description:'Add your first friend', icon:'🤝', category:'social', requirement:'friends>=1', rewardXP:100, rewardCurrency:50, rarity:'common' },
    { achievementId:'gifter', name:'Generous', description:'Send your first gift', icon:'🎁', category:'social', requirement:'gifts_sent>=1', rewardXP:150, rewardCurrency:75, rarity:'common' },
    { achievementId:'challenger', name:'Challenger', description:'Win a challenge', icon:'🏆', category:'social', requirement:'challenges_won>=1', rewardXP:300, rewardCurrency:150, rarity:'uncommon' },
    { achievementId:'alliance-member', name:'Team Player', description:'Join an alliance', icon:'🤝', category:'social', requirement:'in_alliance', rewardXP:200, rewardCurrency:100, rarity:'common' },
    // Mastery
    { achievementId:'level-5', name:'Rising Star', description:'Reach level 5', icon:'⭐', category:'mastery', requirement:'level>=5', rewardXP:300, rewardCurrency:150, rarity:'common' },
    { achievementId:'level-10', name:'Veteran', description:'Reach level 10', icon:'🌟', category:'mastery', requirement:'level>=10', rewardXP:1000, rewardCurrency:500, rarity:'rare' },
    { achievementId:'level-25', name:'Master', description:'Reach level 25', icon:'💫', category:'mastery', requirement:'level>=25', rewardXP:5000, rewardCurrency:2500, rarity:'epic' },
    { achievementId:'powerup-collector', name:'Power Hungry', description:'Collect 20 power-ups', icon:'⚡', category:'mastery', requirement:'powerups>=20', rewardXP:500, rewardCurrency:250, rarity:'uncommon' },
  ];

  await Achievement.insertMany(achievements);
  console.log(`✅ Seeded ${achievements.length} achievements`);
  await mongoose.connection.close();
  process.exit(0);
}
seed().catch(e => { console.error(e); process.exit(1); });
