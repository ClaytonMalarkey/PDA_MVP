const User = require('../models/User');
const UserTask = require('../models/UserTask');
const { validatePassword } = require('../utils/validation');

// Get user profile
const getProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId).select('-passwordHash');
    
    // Get task completion count
    const tasksCompleted = await UserTask.countDocuments({
      userId,
      status: 'completed'
    });

    res.json({
      ...user.toObject(),
      tasksCompleted
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { email } = req.body;

    const updates = {};
    if (email) updates.email = email;

    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true }
    ).select('-passwordHash');

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;

    // Validate new password
    if (!validatePassword(newPassword)) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters with at least one number' 
      });
    }

    // Get user
    const user = await User.findById(userId);

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.passwordHash = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

// Delete account
const deleteAccount = async (req, res) => {
  try {
    const userId = req.userId;
    const { password } = req.body;

    // Get user
    const user = await User.findById(userId);

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Password is incorrect' });
    }

    // Delete user and related data
    await User.findByIdAndDelete(userId);
    await UserTask.deleteMany({ userId });
    
    const UserStructure = require('../models/UserStructure');
    await UserStructure.deleteMany({ userId });
    
    const Transaction = require('../models/Transaction');
    await Transaction.deleteMany({ userId });

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount
};
