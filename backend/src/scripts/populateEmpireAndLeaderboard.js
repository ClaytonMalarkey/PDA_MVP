require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const UserStructure = require('../models/UserStructure');
const Structure = require('../models/Structure');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const populateData = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('Clearing existing user structures...');
    await UserStructure.deleteMany({});

    // Get all users
    const users = await User.find();
    console.log(`Found ${users.length} users`);

    if (users.length === 0) {
      console.log('No users found. Please run seed.js first to create users.');
      process.exit(0);
    }

    // Update users with varied XP, currency, and ranks for leaderboard
    console.log('Updating user stats for leaderboard...');
    const userUpdates = users.map((user, index) => {
      const xp = Math.floor(Math.random() * 5000) + 500;
      const currency = Math.floor(Math.random() * 10000) + 1000;
      const rank = Math.floor(xp / 100) + 1;
      const streak = Math.floor(Math.random() * 30) + 1;
      
      return User.findByIdAndUpdate(user._id, {
        xp,
        currency,
        rank,
        streak,
        lastActivityDate: new Date()
      });
    });

    await Promise.all(userUpdates);
    console.log('User stats updated!');

    // Get all structures
    const structures = await Structure.find();
    console.log(`Found ${structures.length} structures`);

    if (structures.length === 0) {
      console.log('No structures found. Creating sample structures...');
      
      const sampleStructures = [
        {
          structureId: 'gym',
          name: 'Gym',
          description: 'Physical training facility',
          category: 'fitness',
          cost: 500,
          maintenanceCost: 50,
          benefits: { xpBoost: 10, currencyBoost: 5 },
          requirements: { rank: 1 }
        },
        {
          structureId: 'library',
          name: 'Library',
          description: 'Knowledge repository',
          category: 'education',
          cost: 800,
          maintenanceCost: 30,
          benefits: { xpBoost: 15, currencyBoost: 10 },
          requirements: { rank: 2 }
        },
        {
          structureId: 'meditation-hall',
          name: 'Meditation Hall',
          description: 'Mental discipline center',
          category: 'mindfulness',
          cost: 1000,
          maintenanceCost: 40,
          benefits: { xpBoost: 20, currencyBoost: 15 },
          requirements: { rank: 3 }
        },
        {
          structureId: 'workshop',
          name: 'Workshop',
          description: 'Skill development center',
          category: 'skills',
          cost: 1200,
          maintenanceCost: 60,
          benefits: { xpBoost: 25, currencyBoost: 20 },
          requirements: { rank: 4 }
        },
        {
          structureId: 'training-ground',
          name: 'Training Ground',
          description: 'Advanced training facility',
          category: 'fitness',
          cost: 1500,
          maintenanceCost: 75,
          benefits: { xpBoost: 30, currencyBoost: 25 },
          requirements: { rank: 5 }
        }
      ];

      await Structure.insertMany(sampleStructures);
      console.log('Sample structures created!');
    }

    // Refresh structures list
    const allStructures = await Structure.find();

    // Create user structures (empire buildings)
    console.log('Creating user structures (empire buildings)...');
    const userStructures = [];

    for (const user of users) {
      // Each user gets 1-4 random buildings
      const numBuildings = Math.floor(Math.random() * 4) + 1;
      const shuffled = [...allStructures].sort(() => 0.5 - Math.random());
      const selectedStructures = shuffled.slice(0, numBuildings);

      for (const structure of selectedStructures) {
        userStructures.push({
          userId: user._id,
          structureId: structure.structureId,
          level: Math.floor(Math.random() * 3) + 1,
          purchasedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        });
      }
    }

    await UserStructure.insertMany(userStructures);
    console.log(`Created ${userStructures.length} user structures!`);

    console.log('\n✅ Database populated successfully!');
    console.log(`- ${users.length} users updated with leaderboard stats`);
    console.log(`- ${allStructures.length} structures available`);
    console.log(`- ${userStructures.length} empire buildings created`);

    process.exit(0);
  } catch (error) {
    console.error('Error populating data:', error);
    process.exit(1);
  }
};

populateData();
