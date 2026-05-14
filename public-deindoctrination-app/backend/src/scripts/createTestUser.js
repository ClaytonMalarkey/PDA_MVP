require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const createTestUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create test user
    const testEmail = 'specialkey2025@gmail.com';
    const testPassword = 'Test12345';

    // Delete if exists
    await User.deleteOne({ email: testEmail });

    // Create new user
    const user = new User({
      email: testEmail,
      passwordHash: testPassword,
      role: 'user',
      xp: 0,
      rank: 1,
      currency: 100
    });

    await user.save();
    console.log(`✅ Created test user: ${testEmail}`);
    console.log(`Password: ${testPassword}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createTestUser();
