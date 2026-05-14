/**
 * XP & Level Progression Service
 * Formula: XP = BaseXP × (1+DomainMult) × (1+SynergyMult) × (1+ImpactMult) × (1+RealWorldMult)
 * Level curve: XP_level = 100 × (Level)^1.5
 */

const BASE_XP = 100;
const GROWTH_FACTOR = 1.5;

const RANK_NAMES = [
  'Novice', 'Initiate', 'Apprentice', 'Journeyman', 'Adept',
  'Expert', 'Master', 'Grandmaster', 'Sovereign', 'Ascendant',
  'Luminary', 'Architect', 'Visionary', 'Titan', 'Cosmic Elder'
];

function xpRequiredForLevel(level) {
  return Math.floor(BASE_XP * Math.pow(level, GROWTH_FACTOR));
}

function calculateRank(totalXp) {
  let level = 1;
  let xpRemaining = totalXp;
  while (xpRemaining >= xpRequiredForLevel(level)) {
    xpRemaining -= xpRequiredForLevel(level);
    level++;
  }
  return level;
}

function getRankName(rank) {
  const idx = Math.min(rank - 1, RANK_NAMES.length - 1);
  return RANK_NAMES[Math.max(0, idx)];
}

function xpToNextRank(totalXp) {
  let level = 1;
  let xpRemaining = totalXp;
  while (xpRemaining >= xpRequiredForLevel(level)) {
    xpRemaining -= xpRequiredForLevel(level);
    level++;
  }
  return xpRequiredForLevel(level) - xpRemaining;
}

/**
 * Calculate task XP with all multipliers from SRS
 */
function calculateTaskXP(task, user, options = {}) {
  const baseXP = task.xpReward || 30;
  const domainMult = options.domainMultiplier || 0;
  const synergyMult = options.synergyMultiplier || 0;
  const impactMult = options.impactMultiplier || 0;
  const realWorldMult = task.realReward ? 0.5 : 0;
  const streakMult = Math.min(user.streak * 0.02, 0.5);
  const globalMult = user.globalMultiplier || 1;

  const xp = baseXP * (1 + domainMult) * (1 + synergyMult) * (1 + impactMult) * (1 + realWorldMult) * (1 + streakMult) * globalMult;

  // Small random variance ±5%
  const variance = 1 + (Math.random() * 0.1 - 0.05);
  return Math.floor(xp * variance);
}

/**
 * Calculate multi-currency rewards from SRS economy model
 */
function calculateTaskRewards(task, user, options = {}) {
  const streakMult = 1 + Math.min(user.streak * 0.02, 0.5);
  const globalMult = user.globalMultiplier || 1;
  const realWorldBonus = task.realReward ? 1.5 : 1;

  const xp = calculateTaskXP(task, user, options);
  const tc = Math.floor((task.currencyReward || 5) * streakMult * globalMult * realWorldBonus);
  const ip = Math.floor((task.xpReward >= 50 ? 5 : 1) * streakMult);
  const it = task.category?.includes('Innovation') || task.category?.includes('Engineering') ? Math.floor(3 * streakMult) : 0;
  const ls = task.xpReward >= 100 ? Math.floor(1 * streakMult) : 0;

  return { xp, tc, ip, it, ls };
}

module.exports = {
  xpRequiredForLevel, calculateRank, getRankName, xpToNextRank,
  calculateTaskXP, calculateTaskRewards, RANK_NAMES
};
