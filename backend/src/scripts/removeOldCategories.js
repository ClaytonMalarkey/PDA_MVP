require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');

const removeOldCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected\n');

    // Categories to remove
    const categoriesToRemove = [
      'Critical Thinking',
      'Media Literacy',
      'Emotional Intelligence',
      'Civic Engagement'
    ];

    console.log('=== REMOVING OLD CATEGORIES ===');
    const result = await Category.deleteMany({
      name: { $in: categoriesToRemove }
    });
    
    console.log(`Deleted ${result.deletedCount} categories\n`);

    // List remaining categories
    console.log('=== REMAINING CATEGORIES ===');
    const remainingCategories = await Category.find()
      .select('name icon description')
      .sort({ name: 1 });
    
    console.log(`Total categories: ${remainingCategories.length}\n`);
    remainingCategories.forEach((category, index) => {
      console.log(`${index + 1}. ${category.icon} ${category.name} - ${category.description || 'No description'}`);
    });

    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

removeOldCategories();
