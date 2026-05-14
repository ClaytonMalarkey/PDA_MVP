require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const UserStructure = require('../models/UserStructure');

async function testEmpireData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected\n');

    // Test the same logic as the controller
    console.log('=== Testing Empire Data Fetch ===\n');
    
    const users = await User.find()
      .select('email username xp currency rank createdAt updatedAt')
      .lean();

    console.log(`Found ${users.length} users`);

    if (users.length === 0) {
      console.log('❌ No users found in database!');
      process.exit(1);
    }

    // Get structure counts for each user
    const empiresWithBuildings = await Promise.all(
      users.map(async (user) => {
        const structures = await UserStructure.find({ userId: user._id });
        
        return {
          userId: user._id,
          email: user.email,
          username: user.username || user.email.split('@')[0],
          buildings: structures,
          resources: user.currency || 0,
          level: user.rank || 1,
          updatedAt: user.updatedAt
        };
      })
    );

    console.log(`\n✅ Successfully created ${empiresWithBuildings.length} empire objects`);
    
    // Show first 3 empires
    console.log('\nFirst 3 empires:');
    empiresWithBuildings.slice(0, 3).forEach((empire, index) => {
      console.log(`\n${index + 1}. ${empire.email}`);
      console.log(`   Username: ${empire.username}`);
      console.log(`   Buildings: ${empire.buildings.length}`);
      console.log(`   Resources: ${empire.resources}`);
      console.log(`   Level: ${empire.level}`);
    });

    // Show total stats
    const totalBuildings = empiresWithBuildings.reduce((sum, e) => sum + e.buildings.length, 0);
    const totalResources = empiresWithBuildings.reduce((sum, e) => sum + e.resources, 0);
    
    console.log('\n=== Summary ===');
    console.log(`Total Empires: ${empiresWithBuildings.length}`);
    console.log(`Total Buildings: ${totalBuildings}`);
    console.log(`Total Resources: ${totalResources}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testEmpireData();
