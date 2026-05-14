#!/usr/bin/env node

/**
 * Test AI Task System
 * Tests the AI-assisted task completion for task 4998
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Task = require('../models/Task');

async function testAITask() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find task 4998
    const task = await Task.findOne({ taskId: '4998' });
    
    if (!task) {
      console.log('❌ Task 4998 not found');
      process.exit(1);
    }

    console.log('\n📋 Task 4998 Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Task ID: ${task.taskId}`);
    console.log(`Title: ${task.title}`);
    console.log(`Category: ${task.category}`);
    console.log(`Description: ${task.description}`);
    console.log(`XP Reward: ${task.xpReward}`);
    console.log(`Currency Reward: ${task.currencyReward}`);
    console.log(`Real Reward: ${task.realReward || 'None'}`);
    console.log(`Requires Verification: ${task.requiresVerification}`);
    console.log(`Active: ${task.isActive}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Check if task is AI-eligible
    const aiKeywords = ['draft', 'design', 'create', 'write', 'plan', 'map', 'invent'];
    const isAIEligible = aiKeywords.some(keyword => 
      task.title.toLowerCase().includes(keyword)
    );

    console.log(`🤖 AI Eligible: ${isAIEligible ? '✅ Yes' : '❌ No'}`);
    
    if (isAIEligible) {
      console.log('\n✨ This task can use AI assistance!');
      console.log('Users can click "Use AI" button to get:');
      console.log('  • Structured guidance');
      console.log('  • Document templates');
      console.log('  • Suggestions and tips');
      console.log('  • Verification criteria');
      console.log('  • AI-assisted completion');
    }

    // Close connection
    await mongoose.connection.close();
    console.log('\n✅ Test completed successfully');
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

testAITask();
