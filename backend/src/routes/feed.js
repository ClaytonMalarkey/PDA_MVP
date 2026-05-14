const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ActivityFeed = require('../models/ActivityFeed');
const Follow = require('../models/Follow');
const User = require('../models/User');

// Get global activity feed
router.get('/global', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 30, 50);
    const feed = await ActivityFeed.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('userId', 'email xp rank');
    res.json(feed);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
});

// Get personal feed (from people you follow + your own)
router.get('/personal', authenticate, async (req, res) => {
  try {
    const following = await Follow.find({ followerId: req.userId }).select('followingId');
    const ids = [req.userId, ...following.map(f => f.followingId)];
    const feed = await ActivityFeed.find({ userId: { $in: ids }, isPublic: true })
      .sort({ createdAt: -1 }).limit(50)
      .populate('userId', 'email xp rank');
    res.json(feed);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch personal feed' });
  }
});

// Get my activity
router.get('/mine', authenticate, async (req, res) => {
  try {
    const feed = await ActivityFeed.find({ userId: req.userId })
      .sort({ createdAt: -1 }).limit(50);
    res.json(feed);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// === FOLLOW SYSTEM ===
router.post('/follow/:userId', authenticate, async (req, res) => {
  try {
    if (req.params.userId === req.userId.toString()) return res.status(400).json({ error: "Can't follow yourself" });
    const target = await User.findById(req.params.userId);
    if (!target) return res.status(404).json({ error: 'User not found' });

    const existing = await Follow.findOne({ followerId: req.userId, followingId: req.params.userId });
    if (existing) return res.status(409).json({ error: 'Already following' });

    await Follow.create({ followerId: req.userId, followingId: req.params.userId });
    res.json({ message: 'Now following ' + target.email.split('@')[0] });
  } catch (e) {
    res.status(500).json({ error: 'Follow failed' });
  }
});

router.delete('/unfollow/:userId', authenticate, async (req, res) => {
  try {
    await Follow.findOneAndDelete({ followerId: req.userId, followingId: req.params.userId });
    res.json({ message: 'Unfollowed' });
  } catch (e) {
    res.status(500).json({ error: 'Unfollow failed' });
  }
});

// Get followers
router.get('/followers/:userId', authenticate, async (req, res) => {
  try {
    const followers = await Follow.find({ followingId: req.params.userId })
      .populate('followerId', 'email xp rank');
    res.json(followers.map(f => f.followerId));
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch followers' });
  }
});

// Get following
router.get('/following/:userId', authenticate, async (req, res) => {
  try {
    const following = await Follow.find({ followerId: req.params.userId })
      .populate('followingId', 'email xp rank');
    res.json(following.map(f => f.followingId));
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch following' });
  }
});

// Get user profile (public)
router.get('/profile/:userId', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('email xp rank currency streak totalTasksCompleted hubLevel skills isPremium createdAt');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const followerCount = await Follow.countDocuments({ followingId: req.params.userId });
    const followingCount = await Follow.countDocuments({ followerId: req.params.userId });
    const isFollowing = await Follow.findOne({ followerId: req.userId, followingId: req.params.userId });

    const recentActivity = await ActivityFeed.find({ userId: req.params.userId, isPublic: true })
      .sort({ createdAt: -1 }).limit(10);

    res.json({
      ...user.toObject(),
      followerCount, followingCount,
      isFollowing: !!isFollowing,
      recentActivity,
      reputation: Math.floor(user.xp / 100) + user.totalTasksCompleted + (user.streak * 2)
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

module.exports = router;
