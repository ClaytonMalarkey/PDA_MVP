/**
 * Task Builder Utility
 * 
 * Provides functions to construct task documents from CSV data.
 * Applies business rules for cooldown periods and verification requirements.
 */

/**
 * Determines the cooldown period (in hours) based on XP reward value
 * 
 * Business Rules:
 * - XP < 120: 24 hours
 * - 120 <= XP <= 150: 48 hours
 * - XP > 150: 168 hours (1 week)
 * 
 * @param {number} xpReward - The XP reward value
 * @returns {number} Cooldown period in hours
 * 
 * Examples:
 * - determineCooldown(100) -> 24
 * - determineCooldown(130) -> 48
 * - determineCooldown(160) -> 168
 */
function determineCooldown(xpReward) {
  if (xpReward < 120) {
    return 24;
  } else if (xpReward >= 120 && xpReward <= 150) {
    return 48;
  } else {
    return 168;
  }
}

/**
 * Determines if a task requires verification based on XP reward value
 * 
 * Business Rule:
 * - Tasks with XP >= 140 require verification
 * - Tasks with XP < 140 do not require verification
 * 
 * @param {number} xpReward - The XP reward value
 * @returns {boolean} True if verification is required, false otherwise
 * 
 * Examples:
 * - requiresVerification(139) -> false
 * - requiresVerification(140) -> true
 * - requiresVerification(150) -> true
 */
function requiresVerification(xpReward) {
  return xpReward >= 140;
}

/**
 * Constructs a task document from CSV row data and parsed rewards
 * 
 * @param {Object} csvRow - The parsed CSV row
 * @param {string} csvRow.taskId - Task ID from CSV
 * @param {string} csvRow.taskName - Task name from CSV
 * @param {string} csvRow.taskCategory - Task category from CSV
 * @param {string} csvRow.taskDescription - Task description from CSV
 * @param {string} csvRow.taskCheck - Task verification instructions from CSV
 * @param {Object} rewards - Parsed reward values
 * @param {number} rewards.xp - XP reward value
 * @param {number} rewards.coins - Coin reward value
 * @param {string|null} realReward - Parsed real reward value (null if "None")
 * @returns {Object} Task document ready for database insertion
 * 
 * Example:
 * buildTask(
 *   { taskId: '1', taskName: 'Meditate', taskCategory: 'Spiritual', 
 *     taskDescription: 'Practice meditation', taskCheck: 'Write a reflection' },
 *   { xp: 100, coins: 20 },
 *   null
 * )
 * -> {
 *   taskId: '1',
 *   title: 'Meditate',
 *   description: 'Practice meditation',
 *   category: 'Spiritual',
 *   xpReward: 100,
 *   currencyReward: 20,
 *   cooldown: 24,
 *   requiresVerification: false,
 *   isActive: true,
 *   realReward: null,
 *   taskCheck: 'Write a reflection'
 * }
 */
function buildTask(csvRow, rewards, realReward = null) {
  const { xp, coins } = rewards;
  
  // Extract and transform taskCheck: trim whitespace, convert empty/whitespace-only to null
  const taskCheck = csvRow.taskCheck && csvRow.taskCheck.trim() 
    ? csvRow.taskCheck.trim() 
    : null;
  
  return {
    taskId: csvRow.taskId,
    title: csvRow.taskName,
    description: csvRow.taskDescription,
    category: csvRow.taskCategory,
    xpReward: xp,
    currencyReward: coins,
    cooldown: determineCooldown(xp),
    requiresVerification: requiresVerification(xp),
    isActive: true,
    realReward: realReward,
    taskCheck: taskCheck
  };
}

module.exports = {
  determineCooldown,
  requiresVerification,
  buildTask
};
