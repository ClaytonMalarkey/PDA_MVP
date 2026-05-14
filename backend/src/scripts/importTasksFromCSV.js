#!/usr/bin/env node

/**
 * CSV Task Import Script
 * 
 * Imports tasks from CSV file into MongoDB database.
 * Handles category creation, duplicate detection, and bulk insertion.
 * 
 * Usage:
 *   node src/scripts/importTasksFromCSV.js [--clear]
 * 
 * Options:
 *   --clear  Delete all existing tasks before import
 */

require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const Task = require('../models/Task');
const Category = require('../models/Category');
const { parseCSV } = require('../utils/csvParser');
const { parseVirtualReward, parseRealReward } = require('../utils/rewardParser');
const { ensureAllCategories } = require('../utils/categoryManager');
const { buildTask } = require('../utils/taskBuilder');

/**
 * ImportLogger - Provides structured logging for import operations
 */
class ImportLogger {
  info(message) {
    console.log(`[INFO] ${message}`);
  }

  warn(message) {
    console.warn(`[WARN] ${message}`);
  }

  error(message, error) {
    console.error(`[ERROR] ${message}`);
    if (error) {
      console.error('Details:', error.message);
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
    }
  }

  logStats(stats) {
    console.log('\n=== Import Statistics ===');
    console.log(`✅ Created: ${stats.created}`);
    console.log(`⏭️  Skipped: ${stats.skipped}`);
    console.log(`❌ Errors: ${stats.errors}`);
    
    if (stats.byCategory && Object.keys(stats.byCategory).length > 0) {
      console.log('\n=== Tasks by Category ===');
      Object.entries(stats.byCategory)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([category, count]) => {
          console.log(`  ${category}: ${count} tasks`);
        });
    }
    console.log('========================\n');
  }
}

const logger = new ImportLogger();

/**
 * Connect to MongoDB database
 */
async function connectDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB');
    return mongoose.connection;
  } catch (error) {
    logger.error('Failed to connect to MongoDB', error);
    throw error;
  }
}

/**
 * Extract unique category names from CSV data
 */
function extractUniqueCategories(csvData) {
  const categories = new Set();
  csvData.forEach(row => {
    if (row.taskCategory && row.taskCategory.trim()) {
      categories.add(row.taskCategory.trim());
    }
  });
  return Array.from(categories);
}

/**
 * Process categories - create missing ones and build mapping
 */
async function processCategories(csvData) {
  logger.info('Processing categories...');
  
  const uniqueCategories = extractUniqueCategories(csvData);
  logger.info(`Found ${uniqueCategories.length} unique categories in CSV`);
  
  const categoryMap = await ensureAllCategories(uniqueCategories);
  
  // Log each category with its icon
  uniqueCategories.forEach(categoryName => {
    const category = categoryMap.get(categoryName);
    if (category) {
      logger.info(`  ${category.icon} ${categoryName}`);
    }
  });
  
  return categoryMap;
}

/**
 * Import tasks from CSV data
 */
async function importTasks(csvData, categoryMap, clearExisting) {
  const stats = {
    created: 0,
    skipped: 0,
    errors: 0,
    byCategory: {}
  };

  // Handle --clear option
  if (clearExisting) {
    logger.info('Clearing existing tasks...');
    const deleteResult = await Task.deleteMany({});
    logger.info(`Deleted ${deleteResult.deletedCount} existing tasks`);
  }

  // Get existing task IDs for duplicate detection
  const existingTaskIds = new Set();
  if (!clearExisting) {
    const existingTasks = await Task.find({}, { taskId: 1 }).lean();
    existingTasks.forEach(task => existingTaskIds.add(task.taskId));
    logger.info(`Found ${existingTaskIds.size} existing tasks`);
  }

  // Build task documents
  const tasksToInsert = [];
  const skippedTasks = [];

  for (const row of csvData) {
    try {
      // Check for duplicate
      if (existingTaskIds.has(row.taskId)) {
        skippedTasks.push(row.taskId);
        stats.skipped++;
        continue;
      }

      // Parse rewards
      const rewards = parseVirtualReward(row.taskVirtualReward);
      const realReward = parseRealReward(row.taskRealReward);

      // Build task document
      const taskDoc = buildTask(row, rewards, realReward);
      tasksToInsert.push(taskDoc);

      // Track by category
      const category = row.taskCategory.trim();
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

    } catch (error) {
      logger.warn(`Error processing task ${row.taskId}: ${error.message}`);
      stats.errors++;
    }
  }

  // Bulk insert tasks
  if (tasksToInsert.length > 0) {
    logger.info(`Inserting ${tasksToInsert.length} tasks...`);
    try {
      const insertResult = await Task.insertMany(tasksToInsert, { ordered: false });
      stats.created = insertResult.length;
      logger.info(`Successfully inserted ${stats.created} tasks`);
    } catch (error) {
      // Handle partial success with insertMany
      if (error.writeErrors) {
        stats.created = tasksToInsert.length - error.writeErrors.length;
        stats.errors += error.writeErrors.length;
        logger.warn(`Partial insert: ${stats.created} succeeded, ${error.writeErrors.length} failed`);
      } else {
        throw error;
      }
    }
  }

  if (skippedTasks.length > 0) {
    logger.info(`Skipped ${skippedTasks.length} duplicate tasks`);
  }

  return stats;
}

/**
 * Verify category coverage - ensure each category has at least one task
 */
async function verifyCategoryCoverage(categoryMap) {
  logger.info('Verifying category coverage...');
  
  const categoriesWithoutTasks = [];
  
  for (const [categoryName, category] of categoryMap) {
    const taskCount = await Task.countDocuments({ category: categoryName });
    if (taskCount === 0) {
      categoriesWithoutTasks.push(categoryName);
      logger.warn(`  ⚠️  Category "${categoryName}" has no tasks`);
    }
  }
  
  if (categoriesWithoutTasks.length === 0) {
    logger.info('✅ All categories have at least one task');
  } else {
    logger.warn(`⚠️  ${categoriesWithoutTasks.length} categories have no tasks`);
  }
}

/**
 * Main orchestration function
 */
async function main() {
  const startTime = Date.now();
  
  try {
    // Parse command-line arguments
    const args = process.argv.slice(2);
    const clearExisting = args.includes('--clear');
    
    logger.info('Starting CSV task import...');
    if (clearExisting) {
      logger.info('Mode: Clear existing tasks before import');
    } else {
      logger.info('Mode: Skip duplicate tasks');
    }
    
    // Connect to database
    await connectDatabase();
    
    // Parse CSV file
    const csvPath = path.join(__dirname, '../../../frontend/public/Task file.csv');
    logger.info(`Reading CSV file: ${csvPath}`);
    const csvData = parseCSV(csvPath);
    logger.info(`Parsed ${csvData.length} tasks from CSV`);
    
    // Process categories
    const categoryMap = await processCategories(csvData);
    
    // Import tasks
    const stats = await importTasks(csvData, categoryMap, clearExisting);
    
    // Log statistics
    logger.logStats(stats);
    
    // Verify category coverage
    await verifyCategoryCoverage(categoryMap);
    
    // Calculate duration
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info(`Import completed in ${duration}s`);
    
    // Close database connection
    await mongoose.connection.close();
    logger.info('Database connection closed');
    
    // Exit with success
    process.exit(0);
    
  } catch (error) {
    logger.error('Import failed', error);
    
    // Close database connection if open
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    
    // Exit with failure
    process.exit(1);
  }
}

// Run main function
if (require.main === module) {
  main();
}

module.exports = { main, ImportLogger };
