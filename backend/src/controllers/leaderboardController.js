const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Get leaderboard
const getLeaderboard = async (req, res) => {
  try {
    const { period = 'all', sortBy = 'xp' } = req.query;
    const userId = req.userId;

    let leaderboard;

    if (period === 'all' || period === 'all-time') {
      // All-time leaderboard based on total XP or other criteria
      let sortCriteria = { xp: -1 };
      
      if (sortBy === 'currency') {
        sortCriteria = { currency: -1 };
      } else if (sortBy === 'rank') {
        sortCriteria = { rank: -1 };
      }
      
      leaderboard = await User.find()
        .select('email username xp currency rank streak isPremium createdAt')
        .sort(sortCriteria)
        .limit(100);
    } else {
      // Time-based leaderboard
      let startDate = new Date();
      
      switch (period) {
        case 'daily':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'weekly':
          startDate.setDate(startDate.getDate() - 7);
          break;
        default:
          startDate = new Date(0);
      }

      // Aggregate XP from transactions in the period
      const xpInPeriod = await Transaction.aggregate([
        {
          $match: {
            currency: 'xp',
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$userId',
            totalXP: { $sum: '$amount' }
          }
        },
        { $sort: { totalXP: -1 } },
        { $limit: 100 }
      ]);

      // Get user details
      const userIds = xpInPeriod.map(item => item._id);
      const users = await User.find({ _id: { $in: userIds } })
        .select('email xp rank streak isPremium');

      // Combine data
      leaderboard = xpInPeriod.map(item => {
        const user = users.find(u => u._id.toString() === item._id.toString());
        return {
          ...user.toObject(),
          periodXP: item.totalXP
        };
      });
    }

    // If no userId (admin view), just return the leaderboard
    if (!userId) {
      const UserTask = require('../models/UserTask');
      
      // Add completed tasks count for each user
      const leaderboardWithDetails = await Promise.all(
        leaderboard.map(async (user) => {
          const completedTasks = await UserTask.countDocuments({
            userId: user._id,
            status: 'completed'
          });
          
          return {
            ...user.toObject(),
            completedTasks
          };
        })
      );
      
      const leaderboardWithPositions = leaderboardWithDetails.map((user, index) => ({
        ...user,
        position: index + 1
      }));
      
      return res.json(leaderboardWithPositions);
    }

    // Find current user's position
    const currentUserIndex = leaderboard.findIndex(
      user => user._id.toString() === userId.toString()
    );

    // If user not in top 100, get their position
    let userPosition = null;
    if (currentUserIndex === -1) {
      const currentUser = await User.findById(userId).select('email xp rank streak isPremium');
      
      if (period === 'all') {
        const position = await User.countDocuments({ xp: { $gt: currentUser.xp } });
        userPosition = {
          ...currentUser.toObject(),
          position: position + 1
        };
      } else {
        // Calculate position for time-based leaderboard
        let startDate = new Date();
        if (period === 'daily') {
          startDate.setHours(0, 0, 0, 0);
        } else if (period === 'weekly') {
          startDate.setDate(startDate.getDate() - 7);
        }

        const userXP = await Transaction.aggregate([
          {
            $match: {
              userId: currentUser._id,
              currency: 'xp',
              createdAt: { $gte: startDate }
            }
          },
          {
            $group: {
              _id: null,
              totalXP: { $sum: '$amount' }
            }
          }
        ]);

        const userPeriodXP = userXP[0]?.totalXP || 0;

        const betterUsers = await Transaction.aggregate([
          {
            $match: {
              currency: 'xp',
              createdAt: { $gte: startDate }
            }
          },
          {
            $group: {
              _id: '$userId',
              totalXP: { $sum: '$amount' }
            }
          },
          {
            $match: {
              totalXP: { $gt: userPeriodXP }
            }
          },
          {
            $count: 'count'
          }
        ]);

        userPosition = {
          ...currentUser.toObject(),
          periodXP: userPeriodXP,
          position: (betterUsers[0]?.count || 0) + 1
        };
      }
    } else {
      userPosition = {
        ...leaderboard[currentUserIndex],
        position: currentUserIndex + 1
      };
    }

    // Add positions to leaderboard
    const leaderboardWithPositions = leaderboard.map((user, index) => ({
      ...user,
      position: index + 1
    }));

    res.json({
      rankings: leaderboardWithPositions,
      userPosition: userPosition?.position
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
};

module.exports = {
  getLeaderboard
};
