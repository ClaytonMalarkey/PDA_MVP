const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Structure = require('../models/Structure');
const Task = require('../models/Task');
const User = require('../models/User');

dotenv.config();

const structures = [
  {
    structureId: 'library',
    name: 'Library',
    description: 'A repository of knowledge that generates passive income through research grants',
    baseCost: 100,
    baseProduction: 5,
    icon: '📚'
  },
  {
    structureId: 'training-grounds',
    name: 'Training Grounds',
    description: 'A facility for developing critical thinking skills',
    baseCost: 250,
    baseProduction: 12,
    icon: '🎯'
  },
  {
    structureId: 'research-lab',
    name: 'Research Lab',
    description: 'Advanced research facility for breakthrough discoveries',
    baseCost: 500,
    baseProduction: 25,
    icon: '🔬'
  },
  {
    structureId: 'trade-hub',
    name: 'Trade Hub',
    description: 'A center for exchanging ideas and resources',
    baseCost: 1000,
    baseProduction: 50,
    icon: '🏛️'
  }
];

const tasks = [
  // Critical Thinking
  {
    taskId: 'ct-1',
    title: 'Identify Logical Fallacies',
    description: 'Review a news article and identify at least 3 logical fallacies',
    category: 'Critical Thinking',
    xpReward: 50,
    currencyReward: 25,
    cooldown: 3600000, // 1 hour
    requiresVerification: false
  },
  {
    taskId: 'ct-2',
    title: 'Analyze Arguments',
    description: 'Break down a complex argument into premises and conclusions',
    category: 'Critical Thinking',
    xpReward: 75,
    currencyReward: 35,
    cooldown: 7200000, // 2 hours
    requiresVerification: false
  },
  {
    taskId: 'ct-3',
    title: 'Evaluate Evidence',
    description: 'Assess the quality and reliability of sources in a research paper',
    category: 'Critical Thinking',
    xpReward: 100,
    currencyReward: 50,
    cooldown: 14400000, // 4 hours
    requiresVerification: true
  },
  
  // Media Literacy
  {
    taskId: 'ml-1',
    title: 'Fact-Check a Claim',
    description: 'Use multiple sources to verify a viral social media claim',
    category: 'Media Literacy',
    xpReward: 60,
    currencyReward: 30,
    cooldown: 3600000, // 1 hour
    requiresVerification: false
  },
  {
    taskId: 'ml-2',
    title: 'Identify Bias',
    description: 'Analyze a news article for political or ideological bias',
    category: 'Media Literacy',
    xpReward: 80,
    currencyReward: 40,
    cooldown: 7200000, // 2 hours
    requiresVerification: false
  },
  {
    taskId: 'ml-3',
    title: 'Compare Coverage',
    description: 'Compare how different news outlets cover the same story',
    category: 'Media Literacy',
    xpReward: 120,
    currencyReward: 60,
    cooldown: 14400000, // 4 hours
    requiresVerification: true
  },
  
  // Emotional Intelligence
  {
    taskId: 'ei-1',
    title: 'Practice Active Listening',
    description: 'Have a conversation where you focus entirely on understanding the other person',
    category: 'Emotional Intelligence',
    xpReward: 40,
    currencyReward: 20,
    cooldown: 3600000, // 1 hour
    requiresVerification: false
  },
  {
    taskId: 'ei-2',
    title: 'Identify Emotions',
    description: 'Journal about your emotional responses to a challenging situation',
    category: 'Emotional Intelligence',
    xpReward: 70,
    currencyReward: 35,
    cooldown: 7200000, // 2 hours
    requiresVerification: false
  },
  {
    taskId: 'ei-3',
    title: 'Empathy Exercise',
    description: 'Write from the perspective of someone with opposing views',
    category: 'Emotional Intelligence',
    xpReward: 90,
    currencyReward: 45,
    cooldown: 14400000, // 4 hours
    requiresVerification: true
  },
  
  // Civic Engagement
  {
    taskId: 'ce-1',
    title: 'Research Local Issues',
    description: 'Identify and research a current issue in your local community',
    category: 'Civic Engagement',
    xpReward: 55,
    currencyReward: 28,
    cooldown: 3600000, // 1 hour
    requiresVerification: false
  },
  {
    taskId: 'ce-2',
    title: 'Contact Representative',
    description: 'Write to your elected representative about an issue you care about',
    category: 'Civic Engagement',
    xpReward: 85,
    currencyReward: 42,
    cooldown: 7200000, // 2 hours
    requiresVerification: true
  },
  {
    taskId: 'ce-3',
    title: 'Attend Community Event',
    description: 'Participate in a local town hall, community meeting, or civic event',
    category: 'Civic Engagement',
    xpReward: 110,
    currencyReward: 55,
    cooldown: 14400000, // 4 hours
    requiresVerification: true
  }
];

const seedDatabase = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Structure.deleteMany({});
    await Task.deleteMany({});
    console.log('Cleared existing data');

    // Insert structures
    await Structure.insertMany(structures);
    console.log(`Inserted ${structures.length} structures`);

    // Insert tasks
    await Task.insertMany(tasks);
    console.log(`Inserted ${tasks.length} tasks`);

    // Create admin user (delete and recreate to ensure fresh credentials)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
    
    // Delete existing admin user
    await User.deleteOne({ email: adminEmail });
    
    // Create fresh admin user
    const admin = new User({
      email: adminEmail,
      passwordHash: adminPassword,
      role: 'admin',
      xp: 1000,
      rank: 5,
      currency: 500
    });
    await admin.save();
    console.log(`Created admin user: ${adminEmail}`);

    console.log('✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedDatabase();
