const Structure = require('../models/Structure');
const UserStructure = require('../models/UserStructure');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Get all available structures
const getStructures = async (req, res) => {
  try {
    const structures = await Structure.find();
    const userId = req.userId;

    // Get user's owned structures
    const userStructures = await UserStructure.find({ userId });
    const ownedIds = userStructures.map(us => us.structureId);

    // Add ownership info
    const structuresWithOwnership = structures.map(structure => ({
      ...structure.toObject(),
      owned: ownedIds.includes(structure.structureId),
      level: userStructures.find(us => us.structureId === structure.structureId)?.level || 0
    }));

    res.json(structuresWithOwnership);
  } catch (error) {
    console.error('Get structures error:', error);
    res.status(500).json({ error: 'Failed to fetch structures' });
  }
};

// Get user's structures
const getUserStructures = async (req, res) => {
  try {
    const userId = req.userId;

    const userStructures = await UserStructure.find({ userId });
    
    // Populate with structure details
    const structuresWithDetails = await Promise.all(
      userStructures.map(async (us) => {
        const structure = await Structure.findOne({ structureId: us.structureId });
        return {
          ...us.toObject(),
          ...structure.toObject(),
          currentProduction: structure.baseProduction * us.level * 1.15
        };
      })
    );

    res.json(structuresWithDetails);
  } catch (error) {
    console.error('Get user structures error:', error);
    res.status(500).json({ error: 'Failed to fetch user structures' });
  }
};

// Purchase a structure
const purchaseStructure = async (req, res) => {
  try {
    const { structureId } = req.params;
    const userId = req.userId;

    // Check if structure exists
    const structure = await Structure.findOne({ structureId });
    if (!structure) {
      return res.status(404).json({ error: 'Structure not found' });
    }

    // Check if already owned
    const existing = await UserStructure.findOne({ userId, structureId });
    if (existing) {
      return res.status(400).json({ error: 'Structure already owned' });
    }

    // Check if user has enough currency
    const user = await User.findById(userId);
    if (user.currency < structure.baseCost) {
      return res.status(400).json({ error: 'Insufficient currency' });
    }

    // Deduct cost
    user.currency -= structure.baseCost;
    await user.save();

    // Create user structure
    const userStructure = new UserStructure({
      userId,
      structureId,
      level: 1
    });
    await userStructure.save();

    // Create transaction
    await Transaction.create({
      userId,
      type: 'structure_purchase',
      amount: -structure.baseCost,
      currency: 'currency',
      metadata: { structureId, structureName: structure.name }
    });

    res.json({
      message: 'Structure purchased successfully',
      userStructure,
      user: {
        currency: user.currency
      }
    });
  } catch (error) {
    console.error('Purchase structure error:', error);
    res.status(500).json({ error: 'Failed to purchase structure' });
  }
};

// Upgrade a structure
const upgradeStructure = async (req, res) => {
  try {
    const { structureId } = req.params;
    const userId = req.userId;

    // Find user structure
    const userStructure = await UserStructure.findOne({ userId, structureId });
    if (!userStructure) {
      return res.status(404).json({ error: 'Structure not owned' });
    }

    // Get structure details
    const structure = await Structure.findOne({ structureId });
    
    // Calculate upgrade cost: baseCost × 1.15^level
    const upgradeCost = Math.floor(structure.baseCost * Math.pow(1.15, userStructure.level));

    // Check if user has enough currency
    const user = await User.findById(userId);
    if (user.currency < upgradeCost) {
      return res.status(400).json({ error: 'Insufficient currency' });
    }

    // Deduct cost
    user.currency -= upgradeCost;
    await user.save();

    // Upgrade structure
    userStructure.level += 1;
    await userStructure.save();

    // Create transaction
    await Transaction.create({
      userId,
      type: 'structure_upgrade',
      amount: -upgradeCost,
      currency: 'currency',
      metadata: { 
        structureId, 
        structureName: structure.name,
        newLevel: userStructure.level
      }
    });

    res.json({
      message: 'Structure upgraded successfully',
      userStructure,
      user: {
        currency: user.currency
      }
    });
  } catch (error) {
    console.error('Upgrade structure error:', error);
    res.status(500).json({ error: 'Failed to upgrade structure' });
  }
};

// Calculate and collect idle income
const collectIdleIncome = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);
    const userStructures = await UserStructure.find({ userId });

    if (userStructures.length === 0) {
      return res.json({ income: 0, message: 'No structures to generate income' });
    }

    const now = Date.now();
    const lastCollected = user.lastIdleCollection || user.lastActivityDate;
    
    // Calculate hours elapsed
    const maxIdleHours = user.isPremium ? 24 : 12;
    const hoursElapsed = Math.min(
      (now - lastCollected.getTime()) / (1000 * 60 * 60),
      maxIdleHours
    );

    // Calculate total production
    let totalProduction = 0;
    for (const userStructure of userStructures) {
      const structure = await Structure.findOne({ structureId: userStructure.structureId });
      totalProduction += structure.baseProduction * userStructure.level * 1.15;
    }

    const idleIncome = Math.floor(totalProduction * hoursElapsed);

    // Award income
    user.currency += idleIncome;
    user.lastIdleCollection = new Date();
    await user.save();

    // Create transaction
    await Transaction.create({
      userId,
      type: 'idle_income',
      amount: idleIncome,
      currency: 'currency',
      metadata: { 
        hoursElapsed: hoursElapsed.toFixed(2),
        cappedAt: hoursElapsed >= maxIdleHours
      }
    });

    res.json({
      income: idleIncome,
      hoursElapsed: hoursElapsed.toFixed(2),
      cappedAt: hoursElapsed >= maxIdleHours,
      user: {
        currency: user.currency
      }
    });
  } catch (error) {
    console.error('Collect idle income error:', error);
    res.status(500).json({ error: 'Failed to collect idle income' });
  }
};

module.exports = {
  getStructures,
  getUserStructures,
  purchaseStructure,
  upgradeStructure,
  collectIdleIncome
};
