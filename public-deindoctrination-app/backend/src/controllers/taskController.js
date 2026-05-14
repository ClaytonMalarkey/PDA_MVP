const Task = require('../models/Task');
const UserTask = require('../models/UserTask');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Get all active tasks
const getTasks = async (req, res) => {
  try {
    const { category } = req.query;
    
    console.log('GET /api/tasks - Fetching tasks...');
    
    const filter = { isActive: true };
    if (category) {
      filter.category = category;
    }

    const tasks = await Task.find(filter).sort({ category: 1, title: 1 });
    
    console.log(`Found ${tasks.length} tasks`);
    
    // Return as array (frontend expects array, not grouped object)
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

// Complete a task
const completeTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { proof } = req.body;
    const userId = req.userId;

    // Find task
    const task = await Task.findOne({ taskId, isActive: true });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check cooldown
    const lastCompletion = await UserTask.findOne({
      userId,
      taskId,
      status: { $in: ['completed', 'pending'] }
    }).sort({ completedAt: -1 });

    if (lastCompletion) {
      const timeSinceCompletion = Date.now() - lastCompletion.completedAt.getTime();
      if (timeSinceCompletion < task.cooldown) {
        const remainingTime = Math.ceil((task.cooldown - timeSinceCompletion) / 1000);
        return res.status(429).json({ 
          error: 'Task on cooldown',
          remainingSeconds: remainingTime
        });
      }
    }

    // Get user for reward calculation
    const user = await User.findById(userId);

    // Calculate rewards
    const streakMultiplier = Math.min(1 + (user.streak * 0.05), 1.5);
    const premiumMultiplier = user.isPremium ? 1.5 : 1.0;
    const totalMultiplier = streakMultiplier * premiumMultiplier;

    const xpAwarded = Math.floor(task.xpReward * totalMultiplier);
    const currencyAwarded = Math.floor(task.currencyReward * totalMultiplier);

    // Create user task record
    const userTask = new UserTask({
      userId,
      taskId,
      status: task.requiresVerification ? 'pending' : 'completed',
      proof,
      xpAwarded,
      currencyAwarded
    });
    await userTask.save();

    // If no verification required, award immediately
    if (!task.requiresVerification) {
      user.xp += xpAwarded;
      user.currency += currencyAwarded;
      
      // Update streak
      const lastActivity = user.lastActivityDate;
      const hoursSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceActivity <= 24) {
        user.streak += 1;
      } else if (hoursSinceActivity > 24) {
        user.streak = 1;
      }
      
      user.lastActivityDate = new Date();
      await user.save();

      // Create transaction records
      await Transaction.create([
        {
          userId,
          type: 'task_reward',
          amount: xpAwarded,
          currency: 'xp',
          metadata: { taskId, taskTitle: task.title }
        },
        {
          userId,
          type: 'task_reward',
          amount: currencyAwarded,
          currency: 'currency',
          metadata: { taskId, taskTitle: task.title }
        }
      ]);
    }

    res.json({
      message: task.requiresVerification ? 'Task submitted for verification' : 'Task completed',
      userTask,
      rewards: {
        xp: xpAwarded,
        currency: currencyAwarded
      },
      user: {
        xp: user.xp,
        currency: user.currency,
        streak: user.streak
      }
    });
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({ error: 'Failed to complete task' });
  }
};

// Get user's task history
const getUserTasks = async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 20, skip = 0 } = req.query;

    const userTasks = await UserTask.find({ userId })
      .sort({ completedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    res.json(userTasks);
  } catch (error) {
    console.error('Get user tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch user tasks' });
  }
};

module.exports = {
  getTasks,
  completeTask,
  getUserTasks
};
