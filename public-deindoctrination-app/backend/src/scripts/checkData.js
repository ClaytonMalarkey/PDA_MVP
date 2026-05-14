require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const UserStructure = require('../models/UserStructure');

const checkData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected\n');

    // Check leaderboard data
    console.log('=== LEADERBOARD DATA ===');
    const users = await User.find()
      .select('email xp currency rank streak')
      .sort({ xp: -1 })
      .limit(5);
    
    console.log(`Top 5 users by XP:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} - XP: ${user.xp}, Currency: ${user.currency}, Rank: ${user.rank}, Streak: ${user.streak}`);
    });

    // Check empire data
    console.log('\n=== EMPIRE DATA ===');
    const structures = await UserStructure.find()
      .populate('userId', 'email')
      .limit(10);
    
    console.log(`Sample empire buildings (first 10):`);
    structures.forEach((structure, index) => {
      console.log(`${index + 1}. User: ${structure.userId?.email} - Structure: ${structure.structureId}, Level: ${structure.level}`);
    });

    console.log(`\nTotal user structures: ${await UserStructure.countDocuments()}`);
    console.log(`Total users: ${await User.countDocuments()}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkData();
