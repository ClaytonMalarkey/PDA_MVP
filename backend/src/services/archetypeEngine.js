/**
 * Player Archetype Engine — Dynamic identity system
 * Analyzes user behavior to determine and evolve their archetype
 */

var ARCHETYPES = {
  builder: { name:'Builder', icon:'🏗️', color:'#f97316', desc:'Creates structures and systems', taskBonus:['Infrastructure Scaling','Technology'], rewardType:'currency', multiplier:1.15 },
  strategist: { name:'Strategist', icon:'🧠', color:'#6366f1', desc:'Plans and optimizes for efficiency', taskBonus:['Economic Growth','Governance'], rewardType:'influence', multiplier:1.12 },
  influencer: { name:'Influencer', icon:'📢', color:'#ec4899', desc:'Inspires and leads others', taskBonus:['Community Building','Social Cooperation'], rewardType:'influence', multiplier:1.18 },
  scientist: { name:'Scientist', icon:'🔬', color:'#3b82f6', desc:'Discovers and innovates', taskBonus:['Technical Innovation','Mental Mastery'], rewardType:'knowledge', multiplier:1.15 },
  warrior: { name:'Warrior', icon:'⚔️', color:'#ef4444', desc:'Disciplined and resilient', taskBonus:['Physical Mastery','Accountability'], rewardType:'xp', multiplier:1.2 },
  creator: { name:'Creator', icon:'🎨', color:'#a855f7', desc:'Brings ideas to life', taskBonus:['Creative Expression','Technology'], rewardType:'legacy', multiplier:1.1 },
  explorer: { name:'Explorer', icon:'🧭', color:'#10b981', desc:'Seeks new frontiers', taskBonus:['Exploration & Expansion','Space Expansion'], rewardType:'xp', multiplier:1.15 },
};

// Analyze user behavior to determine archetype
function detectArchetype(user, avatar) {
  var scores = {};
  Object.keys(ARCHETYPES).forEach(function(k) { scores[k] = 0; });

  // Score based on skills
  if (user.skills) {
    if (user.skills.coding > 5) { scores.builder += 3; scores.scientist += 2; }
    if (user.skills.business > 5) { scores.strategist += 3; scores.influencer += 1; }
    if (user.skills.fitness > 5) { scores.warrior += 3; }
    if (user.skills.creativity > 5) { scores.creator += 3; }
    if (user.skills.spaceTech > 5) { scores.explorer += 3; scores.scientist += 1; }
    if (user.skills.survival > 5) { scores.warrior += 2; scores.explorer += 1; }
  }

  // Score based on activity
  if (user.totalTasksCompleted > 200) scores.warrior += 2;
  if (user.currency > 10000) scores.strategist += 2;
  if (user.influencePoints > 100) scores.influencer += 3;
  if (user.knowledgePoints > 200) scores.scientist += 2;
  if (user.hubLevel >= 4) scores.builder += 3;
  if (user.researchTier > 3) scores.scientist += 2;

  // Avatar contribution
  if (avatar) {
    if (avatar.contributionScore > 500) scores.builder += 2;
    if (avatar.lifetimeKills > 100) scores.warrior += 2;
    if (avatar.reputation > 200) scores.influencer += 2;
  }

  // Find highest
  var best = 'warrior';
  var bestScore = 0;
  Object.entries(scores).forEach(function(entry) {
    if (entry[1] > bestScore) { bestScore = entry[1]; best = entry[0]; }
  });

  return { archetype: best, scores: scores, info: ARCHETYPES[best] };
}

// Get task bonus for archetype
function getArchetypeBonus(archetype, taskCategory) {
  var arch = ARCHETYPES[archetype];
  if (!arch) return 1.0;
  if (arch.taskBonus.indexOf(taskCategory) >= 0) return arch.multiplier;
  return 1.0;
}

// Get all archetypes for display
function getAllArchetypes() {
  return Object.entries(ARCHETYPES).map(function(entry) {
    return { id: entry[0], ...entry[1] };
  });
}

module.exports = { detectArchetype: detectArchetype, getArchetypeBonus: getArchetypeBonus, getAllArchetypes: getAllArchetypes, ARCHETYPES: ARCHETYPES };
