const User = require('../models/User');
const { generateToken, generateResetToken } = require('../utils/jwt');
const { validateEmail, validatePassword } = require('../utils/validation');

// Register new user
const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password
    if (!validatePassword(password)) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters with at least one number' 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Create user
    const user = new User({ 
      email, 
      passwordHash: password 
    });
    await user.save();

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(201).json({ 
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        xp: user.xp,
        rank: user.rank,
        currency: user.currency,
        streak: user.streak,
        isPremium: user.isPremium
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last activity
    user.lastActivityDate = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id, user.role);

    res.json({ 
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        xp: user.xp,
        rank: user.rank,
        currency: user.currency,
        streak: user.streak,
        isPremium: user.isPremium
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Request password reset
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    const resetToken = generateResetToken(user._id);

    // TODO: Send email with reset link
    // For now, return token (in production, send via email)
    res.json({ 
      message: 'Reset link sent',
      resetToken // Remove this in production
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Password reset request failed' });
  }
};

// Reset password with token
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Validate new password
    if (!validatePassword(newPassword)) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters with at least one number' 
      });
    }

    // Verify token
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'reset') {
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    // Update password
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.passwordHash = newPassword;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'Reset token expired' });
    }
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
};

// Verify token and return user
const verify = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        xp: user.xp,
        rank: user.rank,
        currency: user.currency,
        streak: user.streak,
        isPremium: user.isPremium
      }
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
};

module.exports = {
  register,
  login,
  requestPasswordReset,
  resetPassword,
  verify
};
