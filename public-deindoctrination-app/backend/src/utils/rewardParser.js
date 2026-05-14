/**
 * Reward Parser Utility
 * 
 * Provides functions to parse virtual and real reward strings from CSV data.
 * Handles varying whitespace and invalid formats gracefully.
 */

/**
 * Parses virtual reward strings in the format "XXX XP, YY coins"
 * 
 * @param {string} rewardString - The reward string to parse (e.g., "100 XP, 20 coins")
 * @returns {{ xp: number, coins: number }} - Parsed XP and coin values
 * 
 * Examples:
 * - "101 XP, 21 coins" -> { xp: 101, coins: 21 }
 * - "150XP,30coins" -> { xp: 150, coins: 30 }
 * - "invalid" -> { xp: 100, coins: 20 } (with warning)
 */
function parseVirtualReward(rewardString) {
  // Regex pattern to match "XXX XP, YY coins" with flexible whitespace
  // Pattern: (\d+)\s*XP.*?(\d+)\s*coins
  // - (\d+) captures one or more digits (XP value)
  // - \s* matches zero or more whitespace characters
  // - XP matches the literal text "XP" (case-insensitive)
  // - .*? matches any characters (non-greedy) between XP and coins
  // - (\d+) captures one or more digits (coin value)
  // - \s* matches zero or more whitespace characters
  // - coins matches the literal text "coins" (case-insensitive)
  const pattern = /(\d+)\s*XP.*?(\d+)\s*coins/i;
  const match = rewardString.match(pattern);

  if (match) {
    const xp = parseInt(match[1], 10);
    const coins = parseInt(match[2], 10);
    return { xp, coins };
  }

  // If parsing fails, log warning and return default values
  console.warn(`[RewardParser] Unable to parse reward format: "${rewardString}". Using default values (100 XP, 20 coins).`);
  return { xp: 100, coins: 20 };
}

/**
 * Parses real reward strings, handling "None" as null
 * 
 * @param {string} rewardString - The real reward string to parse
 * @returns {string|null} - The reward text or null if "None"
 * 
 * Examples:
 * - "None" -> null
 * - "Special achievement badge" -> "Special achievement badge"
 */
function parseRealReward(rewardString) {
  // Trim whitespace and check if the value is "None" (case-insensitive)
  const trimmed = rewardString.trim();
  
  if (trimmed.toLowerCase() === 'none') {
    return null;
  }
  
  return trimmed;
}

module.exports = {
  parseVirtualReward,
  parseRealReward
};
