const GameConfig = require('../models/GameConfig');

// Get all configs (public — frontend reads this)
const getAllConfigs = async (req, res) => {
  try {
    const configs = await GameConfig.find().lean();
    const map = {};
    configs.forEach(c => { map[c.configKey] = c.value; });
    res.json(map);
  } catch (e) { res.status(500).json({ error: 'Failed to fetch configs' }); }
};

// Get configs by category
const getConfigsByCategory = async (req, res) => {
  try {
    const configs = await GameConfig.find({ category: req.params.category }).lean();
    res.json(configs);
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
};

// Get all configs with full details (admin)
const getAdminConfigs = async (req, res) => {
  try {
    const configs = await GameConfig.find().sort({ category: 1, configKey: 1 }).lean();
    res.json(configs);
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
};

// Update a config (admin only)
const updateConfig = async (req, res) => {
  try {
    const { configKey, value, description, category } = req.body;
    const config = await GameConfig.findOneAndUpdate(
      { configKey },
      { value, description, category, updatedBy: req.user?.email || 'admin' },
      { upsert: true, new: true }
    );
    res.json({ message: `Config "${configKey}" updated`, config });
  } catch (e) { res.status(500).json({ error: 'Failed to update' }); }
};

// Delete a config
const deleteConfig = async (req, res) => {
  try {
    await GameConfig.findOneAndDelete({ configKey: req.params.key });
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
};

module.exports = { getAllConfigs, getConfigsByCategory, getAdminConfigs, updateConfig, deleteConfig };
