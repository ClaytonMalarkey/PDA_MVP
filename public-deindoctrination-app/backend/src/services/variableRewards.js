/**
 * Variable Reward System — Randomized bonuses, rare drops, mystery rewards
 * Creates "just one more task" effect through unpredictable reward spikes
 */

var RARE_DROPS = [
  { id:'golden_crystal', name:'Golden Crystal', icon:'💎', rarity:'rare', bonus:{currency:500}, chance:0.03 },
  { id:'ancient_artifact', name:'Ancient Artifact', icon:'🏺', rarity:'epic', bonus:{xp:1000}, chance:0.01 },
  { id:'void_shard', name:'Void Shard', icon:'🔮', rarity:'legendary', bonus:{legacyStones:5}, chance:0.005 },
  { id:'energy_surge', name:'Energy Surge', icon:'⚡', rarity:'uncommon', bonus:{energy:100}, chance:0.08 },
  { id:'knowledge_tome', name:'Knowledge Tome', icon:'📖', rarity:'rare', bonus:{knowledgePoints:200}, chance:0.04 },
  { id:'influence_crown', name:'Influence Crown', icon:'👑', rarity:'epic', bonus:{influencePoints:50}, chance:0.015 },
  { id:'innovation_core', name:'Innovation Core', icon:'🔧', rarity:'rare', bonus:{innovationTokens:25}, chance:0.03 },
  { id:'streak_shield', name:'Streak Shield', icon:'🛡️', rarity:'uncommon', bonus:{streakProtect:1}, chance:0.06 },
  { id:'xp_jackpot', name:'XP Jackpot', icon:'🎰', rarity:'rare', bonus:{xp:2000}, chance:0.02 },
  { id:'cosmic_key', name:'Cosmic Key', icon:'🗝️', rarity:'legendary', bonus:{currency:2000,xp:2000,legacyStones:3}, chance:0.003 },
];

var RARITY_COLORS = { common:'#94a3b8', uncommon:'#10b981', rare:'#3b82f6', epic:'#8b5cf6', legendary:'#f59e0b' };

// Roll for rare drops after task completion
function rollRareDrops(taskTier, streakCount) {
  var drops = [];
  var streakBonus = 1 + Math.min(streakCount * 0.01, 0.5); // Up to 50% better odds with streak
  var tierBonus = taskTier === 'Mega' ? 3 : taskTier === 'Large' ? 2 : taskTier === 'Medium' ? 1.5 : 1;

  RARE_DROPS.forEach(function(drop) {
    var adjustedChance = drop.chance * streakBonus * tierBonus;
    if (Math.random() < adjustedChance) {
      drops.push(drop);
    }
  });

  return drops;
}

// Generate mystery reward (used for loot boxes, daily bonuses, etc.)
function generateMysteryReward() {
  var roll = Math.random();
  if (roll < 0.40) return { type:'currency', amount:50+Math.floor(Math.random()*150), rarity:'common' };
  if (roll < 0.65) return { type:'xp', amount:100+Math.floor(Math.random()*200), rarity:'common' };
  if (roll < 0.80) return { type:'currency', amount:200+Math.floor(Math.random()*300), rarity:'uncommon' };
  if (roll < 0.90) return { type:'energy', amount:50+Math.floor(Math.random()*100), rarity:'uncommon' };
  if (roll < 0.95) return { type:'influencePoints', amount:20+Math.floor(Math.random()*30), rarity:'rare' };
  if (roll < 0.98) return { type:'innovationTokens', amount:10+Math.floor(Math.random()*20), rarity:'rare' };
  if (roll < 0.995) return { type:'currency', amount:500+Math.floor(Math.random()*500), rarity:'epic' };
  return { type:'legacyStones', amount:3+Math.floor(Math.random()*5), rarity:'legendary' };
}

// Calculate anticipation bonus (almost-unlocked effect)
function getAnticipationData(user) {
  var items = [];
  var xpToNext = (user.rank || 1) * 100 - (user.xp || 0);
  if (xpToNext > 0 && xpToNext < 50) items.push({ label:'Level '+(user.rank+1), remaining:xpToNext, type:'xp', icon:'⭐' });

  var streakMilestones = [3,7,14,30,60,100];
  for (var i = 0; i < streakMilestones.length; i++) {
    var m = streakMilestones[i];
    if ((user.streak||0) < m && (user.streak||0) >= m-3) {
      items.push({ label:m+'-day streak', remaining:m-(user.streak||0), type:'streak', icon:'🔥' });
      break;
    }
  }

  return items;
}

module.exports = {
  RARE_DROPS: RARE_DROPS, RARITY_COLORS: RARITY_COLORS,
  rollRareDrops: rollRareDrops, generateMysteryReward: generateMysteryReward,
  getAnticipationData: getAnticipationData
};
