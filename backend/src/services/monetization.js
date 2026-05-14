/**
 * Monetization Engine — Subscription tiers, AI offers, tournaments, creator economy
 */

var SUBSCRIPTION_TIERS = {
  free: {
    id:'free', name:'Free Explorer', price:0, icon:'🆓', color:'#94a3b8',
    perks:['Core gameplay','30 tasks/day','Basic analytics','Ad-supported'],
    limits:{ dailyTasks:30, rewardMul:1.0, cooldownMul:1.0, adFree:false, aiVerify:true, maxEnergy:100 }
  },
  pro: {
    id:'pro', name:'Pro Pioneer', price:9.99, icon:'⭐', color:'#3b82f6',
    perks:['2x rewards','No ads','Advanced analytics','AI task optimization','Reduced cooldowns','150 max energy','Priority support'],
    limits:{ dailyTasks:100, rewardMul:2.0, cooldownMul:0.5, adFree:true, aiVerify:true, maxEnergy:150 }
  },
  elite: {
    id:'elite', name:'Elite Architect', price:24.99, icon:'💎', color:'#8b5cf6',
    perks:['3x rewards','Exclusive tasks','Premium specializations','Early features','Higher earning','200 max energy','Elite badge','Custom themes'],
    limits:{ dailyTasks:999, rewardMul:3.0, cooldownMul:0.25, adFree:true, aiVerify:true, maxEnergy:200 }
  },
  sovereign: {
    id:'sovereign', name:'Sovereign Commander', price:99.99, icon:'👑', color:'#f59e0b',
    perks:['5x rewards','Direct mentorship access','Business opportunities','Exclusive community','Real-world perks','500 max energy','Sovereign badge','All features unlocked','Revenue sharing'],
    limits:{ dailyTasks:999, rewardMul:5.0, cooldownMul:0.1, adFree:true, aiVerify:true, maxEnergy:500 }
  }
};

// AI-driven offer engine — triggers at peak emotional moments
var OFFER_TRIGGERS = [
  { id:'post_win', trigger:'after_task_complete', condition:function(ctx){return ctx.tasksToday>=3;},
    offer:{ type:'boost', name:'Victory Boost', desc:'Double XP for 1 hour', price:50, icon:'🔥' }},
  { id:'streak_protect', trigger:'streak_at_risk', condition:function(ctx){return ctx.streak>=7&&ctx.hoursSinceActivity>20;},
    offer:{ type:'protection', name:'Streak Shield', desc:'Protect your '+' streak', price:30, icon:'🛡️' }},
  { id:'level_up_bundle', trigger:'near_level_up', condition:function(ctx){return ctx.xpToNext<50;},
    offer:{ type:'bundle', name:'Level Up Bundle', desc:'50 XP + 200 credits + energy refill', price:100, icon:'🎁' }},
  { id:'comeback', trigger:'returning_user', condition:function(ctx){return ctx.daysSinceLogin>=3;},
    offer:{ type:'welcome_back', name:'Welcome Back Pack', desc:'500 credits + full energy + streak restore', price:0, icon:'🎉' }},
  { id:'first_purchase', trigger:'never_purchased', condition:function(ctx){return ctx.totalPurchases===0&&ctx.totalTasks>=10;},
    offer:{ type:'starter', name:'Starter Pack', desc:'1000 credits + 500 XP + 7 days Pro', price:199, icon:'🚀' }},
  { id:'power_hour', trigger:'high_activity', condition:function(ctx){return ctx.tasksLast30min>=5;},
    offer:{ type:'multiplier', name:'Power Hour', desc:'3x all rewards for 60 min', price:150, icon:'⚡' }},
];

function getActiveOffers(userContext) {
  var offers = [];
  OFFER_TRIGGERS.forEach(function(ot) {
    try { if (ot.condition(userContext)) offers.push(ot.offer); } catch(e) {}
  });
  return offers;
}

// Tournament system
var TOURNAMENT_TYPES = [
  { id:'daily_sprint', name:'Daily Sprint', icon:'🏃', duration:86400000, entryFee:50, prizePool:500,
    type:'tasks', goal:'Most tasks in 24h', maxPlayers:100 },
  { id:'weekly_warrior', name:'Weekly Warrior', icon:'⚔️', duration:604800000, entryFee:200, prizePool:5000,
    type:'xp', goal:'Most XP in 7 days', maxPlayers:50 },
  { id:'streak_master', name:'Streak Master', icon:'🔥', duration:2592000000, entryFee:100, prizePool:2000,
    type:'streak', goal:'Longest streak in 30 days', maxPlayers:200 },
  { id:'builder_royale', name:'Builder Royale', icon:'🏗️', duration:604800000, entryFee:300, prizePool:8000,
    type:'structures', goal:'Most structures built', maxPlayers:30 },
  { id:'research_race', name:'Research Race', icon:'🔬', duration:604800000, entryFee:150, prizePool:3000,
    type:'research', goal:'Most research completed', maxPlayers:50 },
];

// Microtransaction bundles
var BUNDLES = [
  { id:'starter', name:'Starter Pack', icon:'🎒', price:199, items:{currency:1000,xp:500}, tag:'BEST FOR NEW PLAYERS' },
  { id:'grinder', name:'Grinder Pack', icon:'⛏️', price:499, items:{currency:3000,energy:200}, tag:'POPULAR' },
  { id:'whale', name:'Empire Pack', icon:'🏰', price:1999, items:{currency:15000,xp:5000,legacyStones:10,influencePoints:100}, tag:'BEST VALUE' },
  { id:'streak_saver', name:'Streak Saver', icon:'🛡️', price:99, items:{streakProtect:3}, tag:'SAVE YOUR STREAK' },
  { id:'research_boost', name:'Research Accelerator', icon:'🔬', price:299, items:{knowledgePoints:500,currency:1000}, tag:'UNLOCK FASTER' },
  { id:'social_climber', name:'Social Climber', icon:'📢', price:399, items:{influencePoints:200,currency:2000}, tag:'RISE IN RANKS' },
];

// Creator economy — revenue split
var CREATOR_CONFIG = {
  platformCut: 0.15, // 15% platform fee
  creatorCut: 0.85, // 85% to creator
  minPayout: 1000, // Minimum credits to cash out
  taskPackPrice: { min: 50, max: 5000 },
};

function getSubscriptionTier(tierId) { return SUBSCRIPTION_TIERS[tierId] || SUBSCRIPTION_TIERS.free; }
function getAllTiers() { return SUBSCRIPTION_TIERS; }
function getTournaments() { return TOURNAMENT_TYPES; }
function getBundles() { return BUNDLES; }

module.exports = {
  SUBSCRIPTION_TIERS: SUBSCRIPTION_TIERS, OFFER_TRIGGERS: OFFER_TRIGGERS, TOURNAMENT_TYPES: TOURNAMENT_TYPES,
  BUNDLES: BUNDLES, CREATOR_CONFIG: CREATOR_CONFIG,
  getActiveOffers: getActiveOffers, getSubscriptionTier: getSubscriptionTier,
  getAllTiers: getAllTiers, getTournaments: getTournaments, getBundles: getBundles
};
