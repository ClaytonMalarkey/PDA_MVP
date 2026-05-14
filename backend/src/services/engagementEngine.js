/**
 * Engagement Engine — Addiction mechanics, milestones, combo system
 */

const MILESTONES = [
  { id:'first_task', name:'First Step', desc:'Complete your first task', icon:'👣', check:u=>u.totalTasksCompleted>=1, xp:50, currency:25 },
  { id:'tasks_10', name:'Getting Started', desc:'Complete 10 tasks', icon:'🔥', check:u=>u.totalTasksCompleted>=10, xp:200, currency:100 },
  { id:'tasks_50', name:'Dedicated', desc:'Complete 50 tasks', icon:'⭐', check:u=>u.totalTasksCompleted>=50, xp:500, currency:250 },
  { id:'tasks_100', name:'Centurion', desc:'Complete 100 tasks', icon:'💯', check:u=>u.totalTasksCompleted>=100, xp:1000, currency:500 },
  { id:'tasks_500', name:'Legendary', desc:'Complete 500 tasks', icon:'🏆', check:u=>u.totalTasksCompleted>=500, xp:5000, currency:2500 },
  { id:'streak_3', name:'3-Day Streak', desc:'Login 3 days in a row', icon:'🔥', check:u=>u.streak>=3, xp:100, currency:50 },
  { id:'streak_7', name:'Week Warrior', desc:'7-day streak', icon:'🔥', check:u=>u.streak>=7, xp:300, currency:150 },
  { id:'streak_30', name:'Monthly Master', desc:'30-day streak', icon:'🔥', check:u=>u.streak>=30, xp:2000, currency:1000 },
  { id:'streak_100', name:'Unstoppable', desc:'100-day streak', icon:'💎', check:u=>u.streak>=100, xp:10000, currency:5000 },
  { id:'rich_1k', name:'Thousandaire', desc:'Earn 1000 credits', icon:'💰', check:u=>u.currency>=1000, xp:200, currency:0 },
  { id:'rich_10k', name:'Mogul', desc:'Earn 10000 credits', icon:'💰', check:u=>u.currency>=10000, xp:1000, currency:0 },
  { id:'level_5', name:'Rising Star', desc:'Reach level 5', icon:'⭐', check:u=>u.rank>=5, xp:300, currency:150 },
  { id:'level_10', name:'Veteran', desc:'Reach level 10', icon:'🌟', check:u=>u.rank>=10, xp:1000, currency:500 },
  { id:'level_25', name:'Master', desc:'Reach level 25', icon:'💫', check:u=>u.rank>=25, xp:5000, currency:2500 },
];

// Combo system: rapid task completion multiplier
function getComboMultiplier(lastActivityTime) {
  if (!lastActivityTime) return { multiplier: 1, label: null };
  var elapsed = (Date.now() - new Date(lastActivityTime).getTime()) / 1000;
  if (elapsed < 60) return { multiplier: 1.5, label: '🔥 COMBO x1.5!' };
  if (elapsed < 120) return { multiplier: 1.35, label: '🔥 COMBO x1.35!' };
  if (elapsed < 300) return { multiplier: 1.2, label: '⚡ COMBO x1.2!' };
  if (elapsed < 600) return { multiplier: 1.1, label: '✨ COMBO x1.1' };
  return { multiplier: 1, label: null };
}

// Streak multiplier
function getStreakMultiplier(streak) {
  if (streak >= 100) return { multiplier: 2.0, label: '💎 100+ STREAK x2.0!' };
  if (streak >= 30) return { multiplier: 1.5, label: '🔥 30+ STREAK x1.5!' };
  if (streak >= 7) return { multiplier: 1.25, label: '🔥 7+ STREAK x1.25' };
  if (streak >= 3) return { multiplier: 1.1, label: '✨ 3+ STREAK x1.1' };
  return { multiplier: 1, label: null };
}

// Check milestones
function checkMilestones(user, unlockedIds) {
  var newMilestones = [];
  MILESTONES.forEach(function(m) {
    if (!unlockedIds.has(m.id) && m.check(user)) {
      newMilestones.push(m);
    }
  });
  return newMilestones;
}

module.exports = { MILESTONES: MILESTONES, getComboMultiplier: getComboMultiplier, getStreakMultiplier: getStreakMultiplier, checkMilestones: checkMilestones };
