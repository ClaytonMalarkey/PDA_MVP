const User = require('../models/User');
const Quest = require('../models/Quest');
const UserQuest = require('../models/UserQuest');
const IncomeGenerator = require('../models/IncomeGenerator');
const UserGenerator = require('../models/UserGenerator');

// ===== HUB LEVELS =====
const HUB_LEVELS = [
  { level: 1, name: 'Small Room', icon: '🏠', cost: 0, maxEnergy: 100, automationSlots: 0, description: 'Your starting space' },
  { level: 2, name: 'Apartment', icon: '🏢', cost: 500, maxEnergy: 150, automationSlots: 1, description: 'More room to grow' },
  { level: 3, name: 'Office', icon: '🏬', cost: 2000, maxEnergy: 200, automationSlots: 2, description: 'Professional workspace' },
  { level: 4, name: 'Facility', icon: '🏭', cost: 10000, maxEnergy: 300, automationSlots: 4, description: 'Industrial operations' },
  { level: 5, name: 'Space Station', icon: '🛸', cost: 50000, maxEnergy: 500, automationSlots: 8, description: 'Orbital command center' }
];

// ===== SKILL DEFINITIONS =====
const SKILL_DEFS = {
  coding: { name: 'Coding', icon: '💻', desc: 'Unlocks tech tasks & automation' },
  business: { name: 'Business', icon: '📊', desc: 'Unlocks income generators' },
  fitness: { name: 'Fitness', icon: '💪', desc: 'Increases max energy' },
  creativity: { name: 'Creativity', icon: '🎨', desc: 'Boosts XP from tasks' },
  survival: { name: 'Survival', icon: '🌿', desc: 'Reduces energy costs' },
  spaceTech: { name: 'Space Tech', icon: '🚀', desc: 'Unlocks space expansion' }
};

const ENERGY_REGEN_PER_HOUR = 10;
const ENERGY_COST_PER_TASK = 5;

// ===== ENERGY SYSTEM =====
function calculateCurrentEnergy(user) {
  const now = Date.now();
  const elapsed = (now - user.lastEnergyRefill.getTime()) / (1000 * 60 * 60);
  const regen = Math.floor(elapsed * ENERGY_REGEN_PER_HOUR);
  const survivalBonus = 1 + (user.skills.survival * 0.02);
  return Math.min(user.energy + Math.floor(regen * survivalBonus), user.maxEnergy);
}

// GET /api/gameplay/status
const getGameStatus = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const currentEnergy = calculateCurrentEnergy(user);
    const hub = HUB_LEVELS[user.hubLevel - 1] || HUB_LEVELS[0];
    const nextHub = HUB_LEVELS[user.hubLevel] || null;

    // Reset daily tasks if new day
    const today = new Date().toDateString();
    const lastReset = user.lastDailyReset ? new Date(user.lastDailyReset).toDateString() : '';
    if (today !== lastReset) {
      user.dailyTasksCompleted = 0;
      user.lastDailyReset = new Date();
      await user.save();
    }

    // Get income generators
    const userGens = await UserGenerator.find({ userId: req.userId });
    const allGens = await IncomeGenerator.find({ isActive: true });
    let totalIncome = 0;
    const generators = userGens.map(ug => {
      const gen = allGens.find(g => g.generatorId === ug.generatorId);
      if (gen) {
        const income = gen.baseIncome * ug.level * (ug.isAutomated ? 1.5 : 1);
        totalIncome += income;
        return { ...gen.toObject(), level: ug.level, isAutomated: ug.isAutomated, currentIncome: income };
      }
      return null;
    }).filter(Boolean);

    res.json({
      energy: currentEnergy,
      maxEnergy: user.maxEnergy,
      hub: { ...hub, current: true },
      nextHub,
      skills: user.skills,
      skillDefs: SKILL_DEFS,
      hubLevels: HUB_LEVELS,
      incomePerHour: totalIncome,
      generators,
      totalTasksCompleted: user.totalTasksCompleted,
      dailyTasksCompleted: user.dailyTasksCompleted,
      questsCompleted: user.questsCompleted,
      automationSlots: hub.automationSlots,
      automationUsed: userGens.filter(g => g.isAutomated).length
    });
  } catch (error) {
    console.error('Get game status error:', error);
    res.status(500).json({ error: 'Failed to get game status' });
  }
};

// POST /api/gameplay/spend-energy
const spendEnergy = async (req, res) => {
  try {
    const { amount = ENERGY_COST_PER_TASK } = req.body;
    const user = await User.findById(req.userId);
    const current = calculateCurrentEnergy(user);
    if (current < amount) return res.status(400).json({ error: 'Not enough energy' });

    user.energy = current - amount;
    user.lastEnergyRefill = new Date();
    await user.save();
    res.json({ energy: user.energy, maxEnergy: user.maxEnergy });
  } catch (error) {
    res.status(500).json({ error: 'Failed to spend energy' });
  }
};

// POST /api/gameplay/upgrade-hub
const upgradeHub = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const nextLevel = user.hubLevel + 1;
    const nextHub = HUB_LEVELS.find(h => h.level === nextLevel);
    if (!nextHub) return res.status(400).json({ error: 'Already at max hub level' });
    if (user.currency < nextHub.cost) return res.status(400).json({ error: `Need ${nextHub.cost} currency` });

    user.currency -= nextHub.cost;
    user.hubLevel = nextLevel;
    user.maxEnergy = nextHub.maxEnergy;
    user.automationSlots = nextHub.automationSlots;
    await user.save();

    res.json({ message: `Upgraded to ${nextHub.name}!`, hub: nextHub, currency: user.currency });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upgrade hub' });
  }
};

// POST /api/gameplay/train-skill
const trainSkill = async (req, res) => {
  try {
    const { skill } = req.params;
    if (!SKILL_DEFS[skill]) return res.status(400).json({ error: 'Invalid skill' });

    const user = await User.findById(req.userId);
    const current = calculateCurrentEnergy(user);
    const cost = 10 + user.skills[skill] * 2;
    if (current < cost) return res.status(400).json({ error: `Need ${cost} energy` });

    user.energy = current - cost;
    user.lastEnergyRefill = new Date();
    user.skills[skill] += 1;
    user.xp += 20 + user.skills[skill] * 5;

    // Fitness bonus: increase max energy
    if (skill === 'fitness') user.maxEnergy += 5;

    await user.save();
    res.json({
      message: `${SKILL_DEFS[skill].name} leveled up to ${user.skills[skill]}!`,
      skills: user.skills, energy: user.energy, maxEnergy: user.maxEnergy
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to train skill' });
  }
};

// ===== INCOME GENERATORS =====
// GET /api/gameplay/generators
const getGenerators = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const allGens = await IncomeGenerator.find({ isActive: true }).sort({ baseCost: 1 });
    const userGens = await UserGenerator.find({ userId: req.userId });
    const ownedMap = {};
    userGens.forEach(ug => { ownedMap[ug.generatorId] = ug; });

    const result = allGens.map(gen => {
      const owned = ownedMap[gen.generatorId];
      const canAfford = user.currency >= (owned ? Math.floor(gen.baseCost * Math.pow(1.15, owned.level)) : gen.baseCost);
      const meetsRequirements = user.hubLevel >= gen.requiredHubLevel &&
        (!gen.requiredSkill || user.skills[gen.requiredSkill] >= gen.requiredSkillLevel);
      return {
        ...gen.toObject(),
        owned: !!owned,
        level: owned?.level || 0,
        isAutomated: owned?.isAutomated || false,
        currentIncome: owned ? gen.baseIncome * owned.level * (owned.isAutomated ? 1.5 : 1) : 0,
        upgradeCost: owned ? Math.floor(gen.baseCost * Math.pow(1.15, owned.level)) : gen.baseCost,
        canAfford, meetsRequirements
      };
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch generators' });
  }
};

// POST /api/gameplay/generators/:id/buy
const buyGenerator = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.userId);
    const gen = await IncomeGenerator.findOne({ generatorId: id });
    if (!gen) return res.status(404).json({ error: 'Generator not found' });

    if (user.hubLevel < gen.requiredHubLevel) return res.status(400).json({ error: `Requires hub level ${gen.requiredHubLevel}` });
    if (gen.requiredSkill && user.skills[gen.requiredSkill] < gen.requiredSkillLevel)
      return res.status(400).json({ error: `Requires ${gen.requiredSkill} level ${gen.requiredSkillLevel}` });

    const existing = await UserGenerator.findOne({ userId: req.userId, generatorId: id });
    const cost = existing ? Math.floor(gen.baseCost * Math.pow(1.15, existing.level)) : gen.baseCost;
    if (user.currency < cost) return res.status(400).json({ error: 'Not enough currency' });

    user.currency -= cost;
    if (existing) {
      existing.level += 1;
      await existing.save();
    } else {
      await new UserGenerator({ userId: req.userId, generatorId: id }).save();
    }
    await user.save();

    res.json({ message: existing ? 'Generator upgraded!' : 'Generator purchased!', currency: user.currency });
  } catch (error) {
    res.status(500).json({ error: 'Failed to buy generator' });
  }
};

// POST /api/gameplay/generators/:id/automate
const automateGenerator = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.userId);
    const hub = HUB_LEVELS[user.hubLevel - 1];
    const userGens = await UserGenerator.find({ userId: req.userId });
    const automatedCount = userGens.filter(g => g.isAutomated).length;

    if (automatedCount >= hub.automationSlots) return res.status(400).json({ error: 'No automation slots available. Upgrade your hub.' });

    const ug = await UserGenerator.findOne({ userId: req.userId, generatorId: id });
    if (!ug) return res.status(404).json({ error: 'Generator not owned' });
    if (ug.isAutomated) return res.status(400).json({ error: 'Already automated' });

    ug.isAutomated = true;
    await ug.save();
    res.json({ message: 'Generator automated! +50% income bonus' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to automate' });
  }
};

// POST /api/gameplay/collect-income
const collectIncome = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const userGens = await UserGenerator.find({ userId: req.userId });
    const allGens = await IncomeGenerator.find({ isActive: true });

    const now = Date.now();
    const hours = Math.min((now - user.lastIdleCollection.getTime()) / (1000 * 60 * 60), user.isPremium ? 24 : 12);

    let totalIncome = 0;
    userGens.forEach(ug => {
      const gen = allGens.find(g => g.generatorId === ug.generatorId);
      if (gen) totalIncome += gen.baseIncome * ug.level * (ug.isAutomated ? 1.5 : 1);
    });

    const collected = Math.floor(totalIncome * hours * user.globalMultiplier);
    user.currency += collected;
    user.lastIdleCollection = new Date();
    await user.save();

    res.json({ collected, hours: hours.toFixed(1), currency: user.currency });
  } catch (error) {
    res.status(500).json({ error: 'Failed to collect income' });
  }
};

// ===== QUESTS =====
const getQuests = async (req, res) => {
  try {
    const quests = await Quest.find({ isActive: true }).sort({ type: 1, sortOrder: 1 });
    const userQuests = await UserQuest.find({ userId: req.userId });
    const progressMap = {};
    userQuests.forEach(uq => { progressMap[uq.questId] = uq; });

    const result = quests.map(q => ({
      ...q.toObject(),
      progress: progressMap[q.questId]?.progress || 0,
      isCompleted: progressMap[q.questId]?.isCompleted || false
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quests' });
  }
};

const completeQuest = async (req, res) => {
  try {
    const { questId } = req.params;
    const user = await User.findById(req.userId);
    const quest = await Quest.findOne({ questId });
    if (!quest) return res.status(404).json({ error: 'Quest not found' });

    let uq = await UserQuest.findOne({ userId: req.userId, questId });
    if (uq?.isCompleted) return res.status(400).json({ error: 'Already completed' });

    // Check requirements
    if (quest.requirements.tasksToComplete > 0 && user.totalTasksCompleted < quest.requirements.tasksToComplete)
      return res.status(400).json({ error: `Complete ${quest.requirements.tasksToComplete} tasks first` });
    if (quest.requirements.hubLevel > 0 && user.hubLevel < quest.requirements.hubLevel)
      return res.status(400).json({ error: `Requires hub level ${quest.requirements.hubLevel}` });
    if (quest.requirements.skillRequired && user.skills[quest.requirements.skillRequired] < quest.requirements.skillLevel)
      return res.status(400).json({ error: `Requires ${quest.requirements.skillRequired} level ${quest.requirements.skillLevel}` });

    // Award rewards
    const r = quest.rewards;
    user.xp += r.xp || 0;
    user.currency += r.currency || 0;
    user.energy = Math.min(user.energy + (r.energy || 0), user.maxEnergy);
    user.influencePoints += r.influencePoints || 0;
    user.innovationTokens += r.innovationTokens || 0;
    user.legacyStones += r.legacyStones || 0;
    if (r.skillPoints && r.skillAmount) user.skills[r.skillPoints] += r.skillAmount;
    user.questsCompleted += 1;
    await user.save();

    if (!uq) uq = new UserQuest({ userId: req.userId, questId });
    uq.isCompleted = true;
    uq.completedAt = new Date();
    uq.progress = quest.requirements.tasksToComplete;
    await uq.save();

    res.json({ message: 'Quest completed!', rewards: r });
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete quest' });
  }
};

module.exports = {
  getGameStatus, spendEnergy, upgradeHub, trainSkill,
  getGenerators, buyGenerator, automateGenerator, collectIncome,
  getQuests, completeQuest, HUB_LEVELS, SKILL_DEFS
};
