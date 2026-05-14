require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const populateLeaderboard = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create test users with varying XP
    const testUsers = [
      { email: 'user1@test.com', passwordHash: 'Test12345', xp: 5000, rank: 10, currency: 1000 },
      { email: 'user2@test.com', passwordHash: 'Test12345', xp: 4500, rank: 9, currency: 900 },
      { email: 'user3@test.com', passwordHash: 'Test12345', xp: 4000, rank: 8, currency: 800 },
      { email: 'user4@test.com', passwordHash: 'Test12345', xp: 3500, rank: 7, currency: 700 },
      { email: 'user5@test.com', passwordHash: 'Test12345', xp: 3000, rank: 6, currency: 600 },
      { email: 'user6@test.com', passwordHash: 'Test12345', xp: 2500, rank: 5, currency: 500 },
      { email: 'user7@test.com', passwordHash: 'Test12345', xp: 2000, rank: 4, currency: 400 },
      { email: 'user8@test.com', passwordHash: 'Test12345', xp: 1500, rank: 3, currency: 300 },
      { email: 'user9@test.com', passwordHash: 'Test12345', xp: 1000, rank: 2, currency: 200 },
      { email: 'user10@test.com', passwordHash: 'Test12345', xp: 500, rank: 1, currency: 100 },
    ];

    // Delete existing test users
    await User.deleteMany({ email: { $in: testUsers.map(u => u.email) } });

    // Create new test users
    for (const userData of testUsers) {
      const user = new User(userData);
      await user.save();
    }

    console.log(`✅ Created ${testUsers.length} test users for leaderboard`);
    console.log('Leaderboard is now populated with test data');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

populateLeaderboard();
