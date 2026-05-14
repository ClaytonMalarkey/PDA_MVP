require('dotenv').config();
const mongoose = require('mongoose');
const Task = require('../models/Task');

async function verifyTasks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected\n');

    const tasks = await Task.find();
    console.log(`Total tasks in database: ${tasks.length}\n`);

    if (tasks.length === 0) {
      console.log('❌ No tasks found in database!');
      process.exit(1);
    }

    // Group by category
    const byCategory = {};
    tasks.forEach(task => {
      if (!byCategory[task.category]) {
        byCategory[task.category] = [];
      }
      byCategory[task.category].push(task);
    });

    console.log('Tasks by category:');
    Object.keys(byCategory).forEach(category => {
      console.log(`  ${category}: ${byCategory[category].length} tasks`);
    });

    console.log('\nFirst 5 tasks:');
    tasks.slice(0, 5).forEach((task, index) => {
      console.log(`\n${index + 1}. ${task.title}`);
      console.log(`   ID: ${task.taskId}`);
      console.log(`   Category: ${task.category}`);
      console.log(`   Rewards: ${task.xpReward} XP, ${task.currencyReward} currency`);
      console.log(`   Active: ${task.isActive}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyTasks();
