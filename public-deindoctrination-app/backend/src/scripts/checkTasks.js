require('dotenv').config();
const mongoose = require('mongoose');
const Task = require('../models/Task');

async function checkTasks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const tasks = await Task.find();
    console.log(`Found ${tasks.length} tasks in database:\n`);

    // Group by category
    const byCategory = {};
    tasks.forEach(task => {
      if (!byCategory[task.category]) {
        byCategory[task.category] = [];
      }
      byCategory[task.category].push(task);
    });

    Object.keys(byCategory).forEach(category => {
      console.log(`${category}: ${byCategory[category].length} tasks`);
      byCategory[category].forEach(task => {
        console.log(`  - ${task.taskId}: ${task.title}`);
      });
      console.log('');
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTasks();
