const jwt = require('jsonwebtoken');

const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

const generateResetToken = (userId) => {
  return jwt.sign(
    { userId, type: 'reset' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

module.exports = { generateToken, generateResetToken };
