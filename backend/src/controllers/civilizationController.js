const Civilization = require('../models/Civilization');
const User = require('../models/User');

const getAllCivilizations = async (req, res) => {
  try {
    const civs = await Civilization.find()
      .populate('leaderId', 'email rank xp')
      .lean();
    const enriched = civs.map(c => ({ ...c, memberCount: c.members.length }));
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch civilizations' });
  }
};

const createCivilization = async (req, res) => {
  try {
    const { name, governanceType, icon, description } = req.body;
    const userId = req.userId;
    const user = await User.findById(userId);

    if (user.civilizationId) return res.status(400).json({ error: 'Already in a civilization' });
    if (user.influencePoints < 50) return res.status(400).json({ error: 'Need 50 IP to create a civilization' });

    const civ = new Civilization({
      name, governanceType: governanceType || 'democratic',
      icon: icon || '🏛️', description: description || '',
      leaderId: userId, members: [userId]
    });
    await civ.save();

    user.civilizationId = civ._id;
    user.influencePoints -= 50;
    await user.save();

    res.json({ message: 'Civilization created!', civilization: civ });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ error: 'Name already taken' });
    res.status(500).json({ error: 'Failed to create civilization' });
  }
};

const joinCivilization = async (req, res) => {
  try {
    const { civId } = req.params;
    const userId = req.userId;
    const user = await User.findById(userId);

    if (user.civilizationId) return res.status(400).json({ error: 'Already in a civilization' });

    const civ = await Civilization.findById(civId);
    if (!civ) return res.status(404).json({ error: 'Civilization not found' });

    civ.members.push(userId);
    await civ.save();

    user.civilizationId = civ._id;
    await user.save();

    res.json({ message: `Joined ${civ.name}!`, civilization: civ });
  } catch (error) {
    res.status(500).json({ error: 'Failed to join civilization' });
  }
};

const leaveCivilization = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user.civilizationId) return res.status(400).json({ error: 'Not in a civilization' });

    const civ = await Civilization.findById(user.civilizationId);
    civ.members = civ.members.filter(m => m.toString() !== userId);
    if (civ.leaderId.toString() === userId && civ.members.length > 0) {
      civ.leaderId = civ.members[0];
    }
    await civ.save();

    user.civilizationId = null;
    await user.save();

    if (civ.members.length === 0) await Civilization.findByIdAndDelete(civ._id);

    res.json({ message: 'Left civilization' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to leave civilization' });
  }
};

const getMyCivilization = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user.civilizationId) return res.json(null);

    const civ = await Civilization.findById(user.civilizationId)
      .populate('members', 'email rank xp currency')
      .populate('leaderId', 'email rank xp')
      .lean();
    res.json(civ);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch civilization' });
  }
};

module.exports = { getAllCivilizations, createCivilization, joinCivilization, leaveCivilization, getMyCivilization };
