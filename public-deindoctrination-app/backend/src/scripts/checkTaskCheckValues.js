// Script to check if tasks have taskCheck values in the database
require('dotenv').config();
const mongoose = require('mongoose');
const Task = require('../models/Task');

async function checkTaskCheckValues() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pda');
    console.log('✅ Connected to MongoDB');

    // Count total tasks
    const totalTasks = await Task.countDocuments();
    console.log(`\n📊 Total tasks in database: ${totalTasks}`);

    // Count tasks with taskCheck values (not null and not empty)
    const tasksWithCheck = await Task.countDocuments({ 
      taskCheck: { $exists: true, $ne: null, $ne: '' } 
    });
    console.log(`✓ Tasks with taskCheck values: ${tasksWithCheck}`);

    // Count tasks without taskCheck values
    const tasksWithoutCheck = await Task.countDocuments({ 
      $or: [{ taskCheck: { $exists: false } }, { taskCheck: null }, { taskCheck: '' }] 
    });
    console.log(`○ Tasks without taskCheck values: ${tasksWithoutCheck}`);

    // Show sample tasks with taskCheck
    console.log('\n📋 Sample tasks with taskCheck values:');
    const sampleTasks = await Task.find({ 
      taskCheck: { $exists: true, $ne: null, $ne: '' } 
    }).limit(5).select('taskId title taskCheck');

    if (sampleTasks.length > 0) {
      sampleTasks.forEach((task, index) => {
        console.log(`\n${index + 1}. Task ID: ${task.taskId}`);
        console.log(`   Title: ${task.title}`);
        const checkText = task.taskCheck || '';
        console.log(`   TaskCheck: ${checkText.substring(0, 100)}${checkText.length > 100 ? '...' : ''}`);
      });
    } else {
      console.log('   No tasks with taskCheck values found.');
    }

    // Show sample tasks without taskCheck
    console.log('\n📋 Sample tasks without taskCheck values:');
    const sampleTasksWithout = await Task.find({ 
      $or: [{ taskCheck: { $exists: false } }, { taskCheck: null }, { taskCheck: '' }] 
    }).limit(3).select('taskId title taskCheck');

    if (sampleTasksWithout.length > 0) {
      sampleTasksWithout.forEach((task, index) => {
        console.log(`\n${index + 1}. Task ID: ${task.taskId}`);
        console.log(`   Title: ${task.title}`);
        console.log(`   TaskCheck: ${task.taskCheck === null ? 'null' : task.taskCheck === '' ? 'empty string' : 'undefined'}`);
      });
    } else {
      console.log('   All tasks have taskCheck values.');
    }

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkTaskCheckValues();
