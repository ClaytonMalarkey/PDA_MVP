/**
 * Player Archetype System — Dynamic identity that evolves with behavior
 * 7 archetypes, each alters task generation, rewards, and progression
 */

var ARCHETYPES = {
  builder: { name:'Builder', icon:'🏗️', color:'#f97316', desc:'Creates structures, systems, and infrastructure',
    taskBonus:['Infrastructure Scaling','Technology'], rewardMul:{currency:1.3,xp:1.0}, skillBonus:'business',
    traits:['Structures cost 20% less','Idle income +25%','Build speed doubled'] },
  strategist: { name:'Strategist', icon:'🧠', color:'#6366f1', desc:'Plans, optimizes, and thinks long-term',
    taskBonus:['Critical Thinking','Governance'], rewardMul:{currency:1.0,xp:1.3}, skillBonus:'coding',
    traits:['Research 30% faster','XP from tasks +30%','Combo window extended'] },
  influencer: { name:'Influencer', icon:'📢', color:'#ec4899', desc:'Connects people and builds communities',
    taskBonus:['Community Building','Creative Expression'], rewardMul:{currency:1.1,xp:1.1,ip:1.5}, skillBonus:'creativity',
    traits:['Influence Points +50%','Guild bonuses doubled','Social tasks give 2x rewards'] },
  scientist: { name:'Scientist', icon:'🔬', color:'#3b82f6', desc:'Researches, discovers, and innovates',
    taskBonus:['Space Expansion','Technology'], rewardMul:{currency:1.0,xp:1.2,kp:1.5}, skillBonus:'spaceTech',
    traits:['Knowledge Points +50%','Research costs -25%','Unlock rare research paths'] },
  warrior: { name:'Warrior', icon:'⚔️', color:'#ef4444', desc:'Disciplined, focused, and relentless',
    taskBonus:['Physical Mastery','Accountability'], rewardMul:{currency:1.0,xp:1.2}, skillBonus:'fitness',
    traits:['Combat damage +30%','Streak protection free once/week','HP regen in game'] },
  creator: { name:'Creator', icon:'🎨', color:'#a855f7', desc:'Makes art, content, and culture',
    taskBonus:['Creative Expression','Community Building'], rewardMul:{currency:1.2,xp:1.0,ls:1.3}, skillBonus:'creativity',
    traits:['Legacy Stones +30%','Cosmetic unlocks faster','Creative tasks give bonus loot'] },
  explorer: { name:'Explorer', icon:'🧭', color:'#14b8a6', desc:'Discovers new frontiers and possibilities',
    taskBonus:['Space Expansion','Self-Reliance'], rewardMul:{currency:1.1,xp:1.1}, skillBonus:'survival',
    traits:['Fuel drain -30%','Map reveals faster','Rare resource discovery +50%'] },
};

// Detect archetype from user behavior
function detectArchetype(user) {
  var scores = {};
  Object.keys(ARCHETYPES).forEach(function(k) { scores[k] = 0; });

  // Score based on skills
  if (user.skills) {
    if (user.skills.business > 3) scores.builder += user.skills.business;
    if (user.skills.coding > 3) scores.strategist += user.skills.coding;
    if (user.skills.creativity > 3) { scores.influencer += user.skills.creativity; scores.creator += user.skills.creativity; }
    if (user.skills.spaceTech > 3) scores.scientist += user.skills.spaceTech;
    if (user.skills.fitness > 3) scores.warrior += user.skills.fitness;
    if (user.skills.survival > 3) scores.explorer += user.skills.survival;
  }

  // Score based on dominant domain
  var domain = user.dominantDomain || '';
  if (domain.includes('Technology') || domain.includes('Infrastructure')) scores.builder += 5;
  if (domain.includes('Critical') || domain.includes('Governance')) scores.strategist += 5;
  if (domain.includes('Community')) scores.influencer += 5;
  if (domain.includes('Space') || domain.includes('Innovation')) scores.scientist += 5;
  if (domain.includes('Physical') || domain.includes('Accountability')) scores.warrior += 5;
  if (domain.includes('Creative')) scores.creator += 5;
  if (domain.includes('Self-Reliance') || domain.includes('Exploration')) scores.explorer += 5;

  // Find top archetype
  var top = 'builder';
  var topScore = 0;
  Object.keys(scores).forEach(function(k) {
    if (scores[k] > topScore) { topScore = scores[k]; top = k; }
  });

  return { primary: top, scores: scores, archetype: ARCHETYPES[top] };
}

// Get reward multipliers for archetype
function getArchetypeMultipliers(archetypeId) {
  var arch = ARCHETYPES[archetypeId];
  if (!arch) return { currency: 1, xp: 1, ip: 1, kp: 1, ls: 1 };
  return {
    currency: arch.rewardMul.currency || 1,
    xp: arch.rewardMul.xp || 1,
    ip: arch.rewardMul.ip || 1,
    kp: arch.rewardMul.kp || 1,
    ls: arch.rewardMul.ls || 1,
  };
}

function getAllArchetypes() { return ARCHETYPES; }

module.exports = { ARCHETYPES: ARCHETYPES, detectArchetype: detectArchetype, getArchetypeMultipliers: getArchetypeMultipliers, getAllArchetypes: getAllArchetypes };
