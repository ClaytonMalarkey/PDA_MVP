require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');

const defaultCategories = [
  {
    name: 'Critical Thinking',
    description: 'Develop analytical and reasoning skills',
    icon: '🧠',
    color: '#8b5cf6',
    isDefault: true
  },
  {
    name: 'Media Literacy',
    description: 'Learn to evaluate and understand media content',
    icon: '📰',
    color: '#3b82f6',
    isDefault: true
  },
  {
    name: 'Emotional Intelligence',
    description: 'Build self-awareness and empathy',
    icon: '❤️',
    color: '#ec4899',
    isDefault: true
  },
  {
    name: 'Civic Engagement',
    description: 'Participate actively in your community',
    icon: '🏛️',
    color: '#10b981',
    isDefault: true
  }
];

async function seedCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check if categories already exist
    const existingCount = await Category.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  ${existingCount} categories already exist. Skipping seed.`);
      console.log('To re-seed, delete existing categories first.\n');
      await mongoose.connection.close();
      return;
    }

    // Create default categories
    console.log('Creating default categories...\n');
    
    for (const categoryData of defaultCategories) {
      const category = new Category(categoryData);
      await category.save();
      console.log(`✅ Created: ${category.name} (${category.icon})`);
    }

    console.log(`\n✅ Successfully created ${defaultCategories.length} default categories!`);
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    process.exit(1);
  }
}

seedCategories();
