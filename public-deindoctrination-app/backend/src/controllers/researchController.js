const ResearchNode = require('../models/ResearchNode');
const ResearchProgress = require('../models/ResearchProgress');
const User = require('../models/User');

// Get all research nodes with user progress
const getResearchTree = async (req, res) => {
  try {
    const nodes = await ResearchNode.find().lean();
    const progress = await ResearchProgress.find({ userId: req.userId }).lean();
    const completedIds = new Set(progress.filter(p => p.isCompleted).map(p => p.nodeId));
    const inProgressIds = new Set(progress.filter(p => !p.isCompleted).map(p => p.nodeId));

    const enriched = nodes.map(node => ({
      ...node,
      status: completedIds.has(node.nodeId) ? 'completed'
        : inProgressIds.has(node.nodeId) ? 'researching'
        : node.dependencies.every(d => completedIds.has(d)) ? 'available'
        : 'locked'
    }));

    res.json(enriched);
  } catch (error) {
    console.error('Get research tree error:', error);
    res.status(500).json({ error: 'Failed to fetch research tree' });
  }
};

// Get domains summary
const getDomainsSummary = async (req, res) => {
  try {
    const nodes = await ResearchNode.find().lean();
    const progress = await ResearchProgress.find({ userId: req.userId, isCompleted: true }).lean();
    const completedIds = new Set(progress.map(p => p.nodeId));

    const domains = {};
    nodes.forEach(node => {
      if (!domains[node.domain]) {
        domains[node.domain] = { total: 0, completed: 0, maxTier: 0 };
      }
      domains[node.domain].total++;
      if (completedIds.has(node.nodeId)) {
        domains[node.domain].completed++;
        domains[node.domain].maxTier = Math.max(domains[node.domain].maxTier, node.tier);
      }
    });

    res.json(domains);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch domains summary' });
  }
};

// Start researching a node
const startResearch = async (req, res) => {
  try {
    const { nodeId } = req.params;
    const userId = req.userId;
    const user = await User.findById(userId);
    const node = await ResearchNode.findOne({ nodeId });

    if (!node) return res.status(404).json({ error: 'Research node not found' });

    // Check dependencies
    const completed = await ResearchProgress.find({ userId, isCompleted: true }).lean();
    const completedIds = new Set(completed.map(p => p.nodeId));
    const depsOk = node.dependencies.every(d => completedIds.has(d));
    if (!depsOk) return res.status(400).json({ error: 'Dependencies not met' });

    // Check already researching
    const existing = await ResearchProgress.findOne({ userId, nodeId });
    if (existing) return res.status(400).json({ error: existing.isCompleted ? 'Already completed' : 'Already researching' });

    // Check cost
    if (user.currency < node.cost) return res.status(400).json({ error: 'Insufficient currency' });

    user.currency -= node.cost;
    await user.save();

    const progress = new ResearchProgress({ userId, nodeId, startedAt: new Date() });
    await progress.save();

    res.json({ message: 'Research started', node, completesAt: new Date(Date.now() + node.researchTime * 1000) });
  } catch (error) {
    console.error('Start research error:', error);
    res.status(500).json({ error: 'Failed to start research' });
  }
};

// Complete research (check time elapsed)
const completeResearch = async (req, res) => {
  try {
    const { nodeId } = req.params;
    const userId = req.userId;

    const progress = await ResearchProgress.findOne({ userId, nodeId });
    if (!progress) return res.status(404).json({ error: 'Research not started' });
    if (progress.isCompleted) return res.status(400).json({ error: 'Already completed' });

    const node = await ResearchNode.findOne({ nodeId });
    const elapsed = (Date.now() - progress.startedAt.getTime()) / 1000;
    if (elapsed < node.researchTime) {
      return res.status(400).json({ error: 'Research not finished yet', remainingSeconds: Math.ceil(node.researchTime - elapsed) });
    }

    progress.isCompleted = true;
    progress.completedAt = new Date();
    await progress.save();

    // Apply rewards
    const user = await User.findById(userId);
    user.xp += node.xpReward;
    user.globalMultiplier *= node.unlocks.globalMultiplier;
    user.researchTier = Math.max(user.researchTier, node.tier);
    user.knowledgePoints += Math.floor(node.xpReward * 0.5);
    await user.save();

    res.json({
      message: 'Research completed!',
      rewards: { xp: node.xpReward, knowledgePoints: Math.floor(node.xpReward * 0.5) },
      unlocks: node.unlocks
    });
  } catch (error) {
    console.error('Complete research error:', error);
    res.status(500).json({ error: 'Failed to complete research' });
  }
};

module.exports = { getResearchTree, getDomainsSummary, startResearch, completeResearch };
