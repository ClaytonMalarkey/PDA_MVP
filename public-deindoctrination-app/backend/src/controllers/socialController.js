const User = require('../models/User');
const { Friend, Chat, Activity, Challenge, Gift, Achievement, UserAchievement, DailyLogin } = require('../models/Social');

// === DAILY LOGIN REWARDS ===
const DAILY_REWARDS = [
  { day:1, xp:50, currency:25 }, { day:2, xp:75, currency:50 }, { day:3, xp:100, currency:75 },
  { day:4, xp:125, currency:100 }, { day:5, xp:200, currency:150 }, { day:6, xp:150, currency:125 },
  { day:7, xp:500, currency:300 }, { day:8, xp:100, currency:75 }, { day:9, xp:125, currency:100 },
  { day:10, xp:150, currency:125 }, { day:11, xp:175, currency:150 }, { day:12, xp:200, currency:175 },
  { day:13, xp:225, currency:200 }, { day:14, xp:750, currency:500 }, { day:15, xp:200, currency:150 },
  { day:16, xp:225, currency:175 }, { day:17, xp:250, currency:200 }, { day:18, xp:275, currency:225 },
  { day:19, xp:300, currency:250 }, { day:20, xp:350, currency:275 }, { day:21, xp:1000, currency:750 },
  { day:22, xp:300, currency:250 }, { day:23, xp:350, currency:275 }, { day:24, xp:400, currency:300 },
  { day:25, xp:450, currency:350 }, { day:26, xp:500, currency:400 }, { day:27, xp:600, currency:450 },
  { day:28, xp:750, currency:500 }, { day:29, xp:1000, currency:750 }, { day:30, xp:2000, currency:1500 },
];

const claimDailyLogin = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const today = new Date().toDateString();
    const lastClaim = await DailyLogin.findOne({ userId: req.userId }).sort({ claimedAt: -1 });

    if (lastClaim && new Date(lastClaim.claimedAt).toDateString() === today)
      return res.status(400).json({ error: 'Already claimed today' });

    let nextDay = 1;
    if (lastClaim) {
      const diff = (Date.now() - lastClaim.claimedAt.getTime()) / (1000 * 60 * 60);
      nextDay = diff < 48 ? (lastClaim.day % 30) + 1 : 1; // Reset if missed 2 days
    }

    const reward = DAILY_REWARDS[nextDay - 1];
    user.xp += reward.xp;
    user.currency += reward.currency;
    await user.save();

    await DailyLogin.create({ userId: req.userId, day: nextDay });
    await Activity.create({ userId: req.userId, type: 'daily_login', message: `Day ${nextDay} login! +${reward.xp}XP +${reward.currency}💰`, isPublic: true });

    res.json({ day: nextDay, reward, nextReward: DAILY_REWARDS[nextDay % 30], streak: nextDay });
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
};

const getDailyLoginStatus = async (req, res) => {
  try {
    const today = new Date().toDateString();
    const lastClaim = await DailyLogin.findOne({ userId: req.userId }).sort({ claimedAt: -1 });
    const claimed = lastClaim && new Date(lastClaim.claimedAt).toDateString() === today;
    const currentDay = lastClaim ? lastClaim.day : 0;
    res.json({ claimed, currentDay, rewards: DAILY_REWARDS, nextReward: DAILY_REWARDS[currentDay % 30] });
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
};

// === ACTIVITY FEED ===
const getActivityFeed = async (req, res) => {
  try {
    const activities = await Activity.find({ isPublic: true }).sort({ createdAt: -1 }).limit(50).populate('userId', 'email rank');
    res.json(activities);
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
};

const postActivity = async (userId, type, message, data = {}) => {
  try { await Activity.create({ userId, type, message, data, isPublic: true }); } catch (e) { console.error('Activity error:', e); }
};

// === FRIENDS ===
const sendFriendRequest = async (req, res) => {
  try {
    const { email } = req.body;
    const friend = await User.findOne({ email });
    if (!friend) return res.status(404).json({ error: 'User not found' });
    if (friend._id.toString() === req.userId.toString()) return res.status(400).json({ error: 'Cannot add yourself' });

    const existing = await Friend.findOne({ userId: req.userId, friendId: friend._id });
    if (existing) return res.status(400).json({ error: 'Already sent' });

    await Friend.create({ userId: req.userId, friendId: friend._id, status: 'pending' });
    res.json({ message: 'Friend request sent!' });
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
};

const acceptFriend = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await Friend.findById(requestId);
    if (!request || request.friendId.toString() !== req.userId.toString()) return res.status(404).json({ error: 'Not found' });
    request.status = 'accepted';
    await request.save();
    // Create reverse friendship
    await Friend.findOneAndUpdate({ userId: req.userId, friendId: request.userId }, { status: 'accepted' }, { upsert: true });
    res.json({ message: 'Friend added!' });
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
};

const getFriends = async (req, res) => {
  try {
    const friends = await Friend.find({ userId: req.userId, status: 'accepted' }).populate('friendId', 'email rank xp currency streak');
    const pending = await Friend.find({ friendId: req.userId, status: 'pending' }).populate('userId', 'email rank xp');
    res.json({ friends: friends.map(f => f.friendId), pendingRequests: pending });
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
};

// === CHAT ===
const sendChat = async (req, res) => {
  try {
    const { message, receiverId, civilizationId } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Empty message' });
    const chat = await Chat.create({ senderId: req.userId, receiverId, civilizationId, message: message.substring(0, 500) });
    res.json(chat);
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
};

const getGlobalChat = async (req, res) => {
  try {
    const chats = await Chat.find({ receiverId: null, civilizationId: null }).sort({ createdAt: -1 }).limit(50).populate('senderId', 'email rank');
    res.json(chats.reverse());
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
};

// === CHALLENGES ===
const createChallenge = async (req, res) => {
  try {
    const { targetEmail, type, goal, wager } = req.body;
    const target = await User.findOne({ email: targetEmail });
    if (!target) return res.status(404).json({ error: 'Player not found' });
    const user = await User.findById(req.userId);
    if (wager > 0 && user.currency < wager) return res.status(400).json({ error: 'Not enough credits for wager' });

    const challenge = await Challenge.create({
      challengerId: req.userId, targetId: target._id, type, goal, wager,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });
    if (wager > 0) { user.currency -= wager; await user.save(); }
    res.json({ message: 'Challenge sent!', challenge });
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
};

const respondChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    const { accept } = req.body;
    const challenge = await Challenge.findById(id);
    if (!challenge || challenge.targetId.toString() !== req.userId.toString()) return res.status(404).json({ error: 'Not found' });

    if (accept) {
      if (challenge.wager > 0) {
        const user = await User.findById(req.userId);
        if (user.currency < challenge.wager) return res.status(400).json({ error: 'Not enough credits' });
        user.currency -= challenge.wager; await user.save();
      }
      challenge.status = 'active'; await challenge.save();
      res.json({ message: 'Challenge accepted!' });
    } else {
      challenge.status = 'declined'; await challenge.save();
      if (challenge.wager > 0) { await User.findByIdAndUpdate(challenge.challengerId, { $inc: { currency: challenge.wager } }); }
      res.json({ message: 'Challenge declined' });
    }
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
};

const getMyChallenges = async (req, res) => {
  try {
    const challenges = await Challenge.find({
      $or: [{ challengerId: req.userId }, { targetId: req.userId }],
      status: { $in: ['pending', 'active'] }
    }).populate('challengerId', 'email rank').populate('targetId', 'email rank');
    res.json(challenges);
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
};

// === GIFTS ===
const sendGift = async (req, res) => {
  try {
    const { receiverEmail, type, amount } = req.body;
    const receiver = await User.findOne({ email: receiverEmail });
    if (!receiver) return res.status(404).json({ error: 'Player not found' });
    const user = await User.findById(req.userId);

    if (type === 'credits') {
      if (user.currency < amount) return res.status(400).json({ error: 'Not enough credits' });
      user.currency -= amount; await user.save();
    }

    await Gift.create({ senderId: req.userId, receiverId: receiver._id, type, amount });
    await postActivity(req.userId, 'gift_sent', `Sent ${amount} ${type} to ${receiver.email}`);
    res.json({ message: 'Gift sent!' });
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
};

const getMyGifts = async (req, res) => {
  try {
    const gifts = await Gift.find({ receiverId: req.userId, claimed: false }).populate('senderId', 'email');
    res.json(gifts);
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
};

const claimGift = async (req, res) => {
  try {
    const gift = await Gift.findById(req.params.id);
    if (!gift || gift.receiverId.toString() !== req.userId.toString() || gift.claimed) return res.status(404).json({ error: 'Not found' });
    const user = await User.findById(req.userId);
    if (gift.type === 'credits') user.currency += gift.amount;
    if (gift.type === 'energy') user.energy = Math.min(user.energy + gift.amount, user.maxEnergy);
    await user.save();
    gift.claimed = true; await gift.save();
    res.json({ message: `Claimed ${gift.amount} ${gift.type}!` });
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
};

// === ACHIEVEMENTS ===
const getAchievements = async (req, res) => {
  try {
    const all = await Achievement.find().sort({ category: 1 });
    const unlocked = await UserAchievement.find({ userId: req.userId });
    const unlockedIds = new Set(unlocked.map(u => u.achievementId));
    res.json(all.map(a => ({ ...a.toObject(), unlocked: unlockedIds.has(a.achievementId) })));
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
};

module.exports = {
  claimDailyLogin, getDailyLoginStatus, getActivityFeed, postActivity,
  sendFriendRequest, acceptFriend, getFriends,
  sendChat, getGlobalChat,
  createChallenge, respondChallenge, getMyChallenges,
  sendGift, getMyGifts, claimGift,
  getAchievements
};
