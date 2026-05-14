const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Avatar = require('../models/Avatar');
const GlobalProject = require('../models/GlobalProject');
const Guild = require('../models/Guild');
const User = require('../models/User');

// === TITLES earned by real achievement ===
const TITLE_RULES = [
  { title:'Newcomer', req:u=>true },
  { title:'Apprentice', req:u=>u.lifetimeTasks>=10 },
  { title:'Journeyman', req:u=>u.lifetimeTasks>=50 },
  { title:'Specialist', req:u=>u.lifetimeTasks>=200 },
  { title:'Master', req:u=>u.lifetimeTasks>=500 },
  { title:'Grandmaster', req:u=>u.lifetimeTasks>=1000 },
  { title:'Builder', req:u=>u.contributionScore>=100 },
  { title:'Architect', req:u=>u.contributionScore>=500 },
  { title:'Pioneer', req:u=>u.contributionScore>=2000 },
  { title:'Founder', req:u=>u.contributionScore>=5000 },
  { title:'Warrior', req:u=>u.lifetimeKills>=100 },
  { title:'Champion', req:u=>u.lifetimeKills>=500 },
  { title:'Legend', req:u=>u.lifetimeXP>=100000 },
  { title:'Civilization Builder', req:u=>u.lifetimeTasks>=2000&&u.contributionScore>=10000 },
];

// === AVATAR ===
router.get('/avatar', authenticate, async (req, res) => {
  try {
    let avatar = await Avatar.findOne({ userId: req.userId });
    if (!avatar) {
      avatar = await Avatar.create({ userId: req.userId, unlockedTitles: ['Newcomer'], unlockedFrames: ['basic'] });
    }
    // Check for new title unlocks
    const newTitles = [];
    TITLE_RULES.forEach(r => {
      if (r.req(avatar) && !avatar.unlockedTitles.includes(r.title)) {
        avatar.unlockedTitles.push(r.title);
        newTitles.push(r.title);
      }
    });
    if (newTitles.length > 0) await avatar.save();
    res.json({ avatar, newTitles, allTitles: TITLE_RULES.map(r => ({ title: r.title, unlocked: avatar.unlockedTitles.includes(r.title) })) });
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

router.post('/avatar/equip', authenticate, async (req, res) => {
  try {
    const { title, frame, trail, aura } = req.body;
    const avatar = await Avatar.findOne({ userId: req.userId });
    if (!avatar) return res.status(404).json({ error: 'No avatar' });
    if (title && avatar.unlockedTitles.includes(title)) avatar.title = title;
    if (frame && avatar.unlockedFrames.includes(frame)) avatar.frame = frame;
    if (trail) avatar.trail = trail;
    if (aura) avatar.aura = aura;
    await avatar.save();
    res.json({ message: 'Avatar updated', avatar });
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

// === GLOBAL PROJECTS ===
router.get('/projects', authenticate, async (req, res) => {
  try {
    const projects = await GlobalProject.find({ isActive: true }).sort({ stage: 1 });
    res.json(projects);
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

router.post('/projects/:id/contribute', authenticate, async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.userId);
    if (user.currency < amount) return res.status(400).json({ error: 'Not enough credits' });

    const project = await GlobalProject.findOne({ projectId: req.params.id, isActive: true });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    user.currency -= amount;
    await user.save();

    project.currentAmount += amount;
    const existing = project.contributors.find(c => c.userId.toString() === req.userId.toString());
    if (existing) existing.amount += amount;
    else project.contributors.push({ userId: req.userId, amount });

    if (project.currentAmount >= project.goalAmount && !project.isCompleted) {
      project.isCompleted = true;
      project.completedAt = new Date();
      // Reward all contributors
      for (const c of project.contributors) {
        const share = c.amount / project.currentAmount;
        await User.findByIdAndUpdate(c.userId, { $inc: { xp: Math.floor(project.rewardXP * share), currency: Math.floor(project.rewardCurrency * share) } });
      }
    }
    await project.save();

    // Update avatar contribution score
    await Avatar.findOneAndUpdate({ userId: req.userId }, { $inc: { contributionScore: amount } }, { upsert: true });

    res.json({ message: 'Contributed ' + amount + ' credits!', project });
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

// === GUILDS ===
router.get('/guilds', authenticate, async (req, res) => {
  try {
    const guilds = await Guild.find().populate('leaderId', 'email rank').lean();
    res.json(guilds.map(g => ({ ...g, memberCount: g.members.length })));
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

router.post('/guilds', authenticate, async (req, res) => {
  try {
    const { name, specialization, description } = req.body;
    const user = await User.findById(req.userId);
    if (user.influencePoints < 100) return res.status(400).json({ error: 'Need 100 IP' });
    user.influencePoints -= 100;
    await user.save();
    const guild = await Guild.create({
      guildId: name.toLowerCase().replace(/\s+/g, '-'),
      name, specialization, description,
      leaderId: req.userId, members: [req.userId],
      icon: { builders:'🏗️', scientists:'🔬', warriors:'⚔️', healers:'💚', traders:'💰', explorers:'🧭', creators:'🎨', leaders:'👑' }[specialization] || '⚔️'
    });
    res.json({ message: 'Guild created!', guild });
  } catch (e) { res.status(500).json({ error: e.code === 11000 ? 'Name taken' : 'Failed' }); }
});

router.post('/guilds/:id/join', authenticate, async (req, res) => {
  try {
    const guild = await Guild.findById(req.params.id);
    if (!guild) return res.status(404).json({ error: 'Not found' });
    if (guild.members.length >= guild.maxMembers) return res.status(400).json({ error: 'Guild full' });
    if (guild.members.includes(req.userId)) return res.status(400).json({ error: 'Already member' });
    guild.members.push(req.userId);
    guild.bonusMultiplier = 1 + guild.members.length * 0.02;
    await guild.save();
    res.json({ message: 'Joined ' + guild.name + '!' });
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

// === STREAK PROTECTION (comeback mechanic) ===
router.post('/streak-protect', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const cost = 50;
    if (user.currency < cost) return res.status(400).json({ error: 'Need 50 credits' });
    user.currency -= cost;
    user.lastActivityDate = new Date(); // Reset the clock
    await user.save();
    res.json({ message: 'Streak protected! 🛡️', streak: user.streak });
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

module.exports = router;
