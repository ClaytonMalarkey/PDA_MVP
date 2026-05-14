const Task = require('../models/Task');
const User = require('../models/User');
const UserTask = require('../models/UserTask');
const Transaction = require('../models/Transaction');
const UIConfig = require('../models/UIConfig');

// Task Management
const createTask = async (req, res) => {
  try {
    const { taskId, title, description, category, xpReward, currencyReward, cooldown, requiresVerification, taskCheck } = req.body;

    const task = new Task({
      taskId,
      title,
      description,
      category,
      xpReward,
      currencyReward,
      cooldown,
      requiresVerification,
      taskCheck
    });

    await task.save();
    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const task = await Task.findByIdAndUpdate(id, updates, { new: true });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
};

const getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    console.error('Get all tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

// User Management
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-passwordHash')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
};

const banUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // For MVP, we'll just set a flag or delete the user
    // In production, implement proper ban system
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User banned successfully' });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({ error: 'Failed to ban user' });
  }
};

// Verification Management
const getPendingVerifications = async (req, res) => {
  try {
    const pending = await UserTask.find({ status: 'pending' })
      .populate('userId', 'email')
      .sort({ createdAt: -1 });

    res.json(pending);
  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({ error: 'Failed to fetch pending verifications' });
  }
};

const approveVerification = async (req, res) => {
  try {
    const { id } = req.params;

    const userTask = await UserTask.findById(id);
    if (!userTask) {
      return res.status(404).json({ error: 'Task submission not found' });
    }

    if (userTask.status !== 'pending') {
      return res.status(400).json({ error: 'Task is not pending verification' });
    }

    // Update status
    userTask.status = 'completed';
    await userTask.save();

    // Award rewards
    const user = await User.findById(userTask.userId);
    user.xp += userTask.xpAwarded;
    user.currency += userTask.currencyAwarded;
    await user.save();

    // Create transaction records
    await Transaction.create([
      {
        userId: userTask.userId,
        type: 'task_reward',
        amount: userTask.xpAwarded,
        currency: 'xp',
        metadata: { taskId: userTask.taskId, verified: true }
      },
      {
        userId: userTask.userId,
        type: 'task_reward',
        amount: userTask.currencyAwarded,
        currency: 'currency',
        metadata: { taskId: userTask.taskId, verified: true }
      }
    ]);

    res.json({ message: 'Verification approved', userTask });
  } catch (error) {
    console.error('Approve verification error:', error);
    res.status(500).json({ error: 'Failed to approve verification' });
  }
};

const rejectVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const userTask = await UserTask.findById(id);
    if (!userTask) {
      return res.status(404).json({ error: 'Task submission not found' });
    }

    userTask.status = 'rejected';
    userTask.metadata = { ...userTask.metadata, rejectionReason: reason };
    await userTask.save();

    res.json({ message: 'Verification rejected', userTask });
  } catch (error) {
    console.error('Reject verification error:', error);
    res.status(500).json({ error: 'Failed to reject verification' });
  }
};

// Metrics
const getMetrics = async (req, res) => {
  try {
    const { range = '7d' } = req.query;

    // Calculate date range
    let startDate = new Date();
    switch (range) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'all':
        startDate = new Date(0);
        break;
    }

    // Total users
    const totalUsers = await User.countDocuments();

    // Active users (users with activity in range)
    const activeUsers = await User.countDocuments({
      lastActivityDate: { $gte: startDate }
    });

    // New users in range
    const newUsers = await User.countDocuments({
      createdAt: { $gte: startDate }
    });

    // Tasks completed in range
    const tasksCompleted = await UserTask.countDocuments({
      completedAt: { $gte: startDate },
      status: 'completed'
    });

    // Average streak
    const streakStats = await User.aggregate([
      { $group: { _id: null, avgStreak: { $avg: '$streak' }, maxStreak: { $max: '$streak' } } }
    ]);

    // Total currency in circulation
    const currencyStats = await User.aggregate([
      { $group: { _id: null, totalCurrency: { $sum: '$currency' } } }
    ]);

    // Premium users
    const premiumUsers = await User.countDocuments({ isPremium: true });

    // Structures built
    const UserStructure = require('../models/UserStructure');
    const structuresBuilt = await UserStructure.countDocuments();

    // Revenue (from transactions)
    const revenueStats = await Transaction.aggregate([
      { $match: { type: { $in: ['payment', 'premium_subscription'] }, currency: 'usd' } },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
    ]);

    // Category stats
    const categoryStats = await UserTask.aggregate([
      {
        $match: {
          completedAt: { $gte: startDate },
          status: 'completed'
        }
      },
      {
        $lookup: {
          from: 'tasks',
          localField: 'taskId',
          foreignField: 'taskId',
          as: 'task'
        }
      },
      { $unwind: '$task' },
      {
        $group: {
          _id: '$task.category',
          completions: { $sum: 1 }
        }
      }
    ]);

    // Get total tasks per category
    const taskCounts = await Task.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const categoryStatsWithRates = categoryStats.map(stat => {
      const taskCount = taskCounts.find(t => t._id === stat._id)?.count || 1;
      return {
        category: stat._id,
        totalTasks: taskCount,
        completions: stat.completions,
        completionRate: (stat.completions / (taskCount * activeUsers)) * 100,
        avgTime: Math.floor(Math.random() * 30) + 5 // Mock data for MVP
      };
    });

    // Top performers
    const topPerformers = await User.find()
      .select('email xp streak currency')
      .sort({ xp: -1 })
      .limit(10);

    // Add task completion count
    const topPerformersWithTasks = await Promise.all(
      topPerformers.map(async (user) => {
        const tasksCompleted = await UserTask.countDocuments({
          userId: user._id,
          status: 'completed'
        });
        return {
          ...user.toObject(),
          tasksCompleted
        };
      })
    );

    res.json({
      totalUsers,
      activeUsers,
      newUsers,
      tasksCompleted,
      averageStreak: streakStats[0]?.avgStreak || 0,
      maxStreak: streakStats[0]?.maxStreak || 0,
      totalCurrency: currencyStats[0]?.totalCurrency || 0,
      premiumUsers,
      structuresBuilt,
      revenue: revenueStats[0]?.totalRevenue || 0,
      categoryStats: categoryStatsWithRates,
      topPerformers: topPerformersWithTasks
    });
  } catch (error) {
    console.error('Get metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
};

// UI Config Management
const getUIConfig = async (req, res) => {
  try {
    const configs = await UIConfig.find();
    
    // Transform to key-value object
    const configObj = configs.reduce((acc, config) => {
      acc[config.configKey] = config.value;
      return acc;
    }, {});

    res.json(configObj);
  } catch (error) {
    console.error('Get UI config error:', error);
    res.status(500).json({ error: 'Failed to fetch UI config' });
  }
};

const updateUIConfig = async (req, res) => {
  try {
    const updates = req.body;

    const promises = Object.entries(updates).map(([key, value]) => {
      return UIConfig.findOneAndUpdate(
        { configKey: key },
        { configKey: key, value, category: getCategoryForKey(key) },
        { upsert: true, new: true }
      );
    });

    await Promise.all(promises);

    res.json({ message: 'UI config updated successfully' });
  } catch (error) {
    console.error('Update UI config error:', error);
    res.status(500).json({ error: 'Failed to update UI config' });
  }
};

// Helper function to determine category
const getCategoryForKey = (key) => {
  if (key.includes('color') || key.includes('theme')) return 'theme';
  if (key.includes('enable') || key.includes('show')) return 'features';
  if (key.includes('text') || key.includes('title') || key.includes('description')) return 'content';
  return 'layout';
};

// Empire Management
const getAllEmpires = async (req, res) => {
  try {
    const UserStructure = require('../models/UserStructure');
    
    console.log('Fetching all empires...');
    
    // Get all users with their empire data
    const users = await User.find()
      .select('email username xp currency rank createdAt updatedAt')
      .lean();

    console.log(`Found ${users.length} users`);

    // Get structure counts for each user
    const empiresWithBuildings = await Promise.all(
      users.map(async (user) => {
        const structures = await UserStructure.find({ userId: user._id });
        
        return {
          userId: user._id,
          email: user.email,
          username: user.username || user.email.split('@')[0],
          buildings: structures,
          resources: user.currency || 0,
          level: user.rank || 1,
          updatedAt: user.updatedAt
        };
      })
    );

    console.log(`Returning ${empiresWithBuildings.length} empires`);
    res.json(empiresWithBuildings);
  } catch (error) {
    console.error('Get all empires error:', error);
    res.status(500).json({ error: 'Failed to fetch empires', details: error.message });
  }
};

module.exports = {
  createTask,
  updateTask,
  deleteTask,
  getAllTasks,
  getAllUsers,
  updateUserRole,
  banUser,
  getPendingVerifications,
  approveVerification,
  rejectVerification,
  getMetrics,
  getUIConfig,
  updateUIConfig,
  getAllEmpires
};
