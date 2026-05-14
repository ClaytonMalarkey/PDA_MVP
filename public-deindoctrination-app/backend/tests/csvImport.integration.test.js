/**
 * INTEGRATION TEST — CSV Import with taskCheck field
 * Run: npx jest tests/csvImport.integration.test.js
 * 
 * This test verifies the end-to-end CSV import workflow:
 * 1. CSV Parser extracts taskCheck from "Task Check" column
 * 2. Task Builder includes taskCheck in task document
 * 3. Import Script saves taskCheck to database
 * 4. Empty Task Check values are stored as null
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const fs = require('fs');
const path = require('path');
const Task = require('../src/models/Task');
const Category = require('../src/models/Category');
const { parseCSV } = require('../src/utils/csvParser');
const { parseVirtualReward, parseRealReward } = require('../src/utils/rewardParser');
const { buildTask } = require('../src/utils/taskBuilder');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Task.deleteMany({});
  await Category.deleteMany({});
});

describe('CSV Import Integration - taskCheck field', () => {
  const testCsvPath = path.join(__dirname, 'test-tasks.csv');

  beforeEach(() => {
    // Create a test CSV file with taskCheck data
    const csvContent = `Task ID,Task Name,Task Category,Task Description,Task Check,Task Virtual Reward,Task Real Reward
1,Meditate on humanity's future,Spiritual,Meditate on humanity's future among the stars.,Write a short reflection on your experience.,"101 XP, 21 coins",None
2,Design a futuristic city,Creative,Design a futuristic city on Mars.,Upload a digital or physical sketch of your design.,"102 XP, 22 coins",None
3,Train your body,Fitness,Train your body to endure long-duration spaceflight.,,"103 XP, 23 coins",None
4,Map interstellar route,Exploration,Map out a theoretical interstellar trade route.,Submit a visual map with reasoning for trade stops.,"104 XP, 24 coins",None
5,Draft constitution,Governance,Draft a constitution for the first human colony.,   ,"105 XP, 25 coins",None`;

    fs.writeFileSync(testCsvPath, csvContent, 'utf-8');
  });

  afterEach(() => {
    // Clean up test CSV file
    if (fs.existsSync(testCsvPath)) {
      fs.unlinkSync(testCsvPath);
    }
  });

  test('TC-INT01: CSV parser extracts taskCheck from Task Check column', () => {
    const csvData = parseCSV(testCsvPath);

    expect(csvData).toHaveLength(5);
    expect(csvData[0].taskCheck).toBe('Write a short reflection on your experience.');
    expect(csvData[1].taskCheck).toBe('Upload a digital or physical sketch of your design.');
    expect(csvData[2].taskCheck).toBe(''); // Empty in CSV
    expect(csvData[3].taskCheck).toBe('Submit a visual map with reasoning for trade stops.');
    expect(csvData[4].taskCheck).toBe(''); // Whitespace-only in CSV (trimmed by parser)
  });

  test('TC-INT02: Task Builder transforms taskCheck correctly', () => {
    const csvData = parseCSV(testCsvPath);

    // Test task with taskCheck value
    const rewards1 = parseVirtualReward(csvData[0].taskVirtualReward);
    const task1 = buildTask(csvData[0], rewards1);
    expect(task1.taskCheck).toBe('Write a short reflection on your experience.');

    // Test task with empty taskCheck
    const rewards2 = parseVirtualReward(csvData[2].taskVirtualReward);
    const task2 = buildTask(csvData[2], rewards2);
    expect(task2.taskCheck).toBeNull();

    // Test task with whitespace-only taskCheck
    const rewards3 = parseVirtualReward(csvData[4].taskVirtualReward);
    const task3 = buildTask(csvData[4], rewards3);
    expect(task3.taskCheck).toBeNull();
  });

  test('TC-INT03: Import workflow saves taskCheck to database', async () => {
    // Create required categories
    await Category.create({ name: 'Spiritual', icon: '🧘' });
    await Category.create({ name: 'Creative', icon: '🎨' });
    await Category.create({ name: 'Fitness', icon: '💪' });
    await Category.create({ name: 'Exploration', icon: '🚀' });
    await Category.create({ name: 'Governance', icon: '⚖️' });

    // Parse CSV
    const csvData = parseCSV(testCsvPath);

    // Build and insert tasks
    const tasksToInsert = [];
    for (const row of csvData) {
      const rewards = parseVirtualReward(row.taskVirtualReward);
      const realReward = parseRealReward(row.taskRealReward);
      const taskDoc = buildTask(row, rewards, realReward);
      tasksToInsert.push(taskDoc);
    }

    await Task.insertMany(tasksToInsert);

    // Verify tasks in database
    const savedTasks = await Task.find({}).sort({ taskId: 1 });
    expect(savedTasks).toHaveLength(5);

    // Task 1: has taskCheck value
    expect(savedTasks[0].taskId).toBe('1');
    expect(savedTasks[0].taskCheck).toBe('Write a short reflection on your experience.');

    // Task 2: has taskCheck value
    expect(savedTasks[1].taskId).toBe('2');
    expect(savedTasks[1].taskCheck).toBe('Upload a digital or physical sketch of your design.');

    // Task 3: empty taskCheck becomes null
    expect(savedTasks[2].taskId).toBe('3');
    expect(savedTasks[2].taskCheck).toBeNull();

    // Task 4: has taskCheck value
    expect(savedTasks[3].taskId).toBe('4');
    expect(savedTasks[3].taskCheck).toBe('Submit a visual map with reasoning for trade stops.');

    // Task 5: whitespace-only taskCheck becomes null
    expect(savedTasks[4].taskId).toBe('5');
    expect(savedTasks[4].taskCheck).toBeNull();
  });

  test('TC-INT04: Imported tasks can be retrieved with taskCheck', async () => {
    // Create required category
    await Category.create({ name: 'Spiritual', icon: '🧘' });

    // Parse CSV and import first task
    const csvData = parseCSV(testCsvPath);
    const rewards = parseVirtualReward(csvData[0].taskVirtualReward);
    const realReward = parseRealReward(csvData[0].taskRealReward);
    const taskDoc = buildTask(csvData[0], rewards, realReward);

    await Task.create(taskDoc);

    // Retrieve task
    const retrievedTask = await Task.findOne({ taskId: '1' });

    expect(retrievedTask).toBeDefined();
    expect(retrievedTask.taskCheck).toBe('Write a short reflection on your experience.');
    expect(retrievedTask.title).toBe('Meditate on humanity\'s future');
    expect(retrievedTask.xpReward).toBe(101);
  });

  test('TC-INT05: Multiple tasks with mixed taskCheck values', async () => {
    // Create required categories
    await Category.create({ name: 'Spiritual', icon: '🧘' });
    await Category.create({ name: 'Creative', icon: '🎨' });
    await Category.create({ name: 'Fitness', icon: '💪' });

    // Parse CSV
    const csvData = parseCSV(testCsvPath);

    // Import first 3 tasks (mix of with/without taskCheck)
    const tasksToInsert = [];
    for (let i = 0; i < 3; i++) {
      const rewards = parseVirtualReward(csvData[i].taskVirtualReward);
      const realReward = parseRealReward(csvData[i].taskRealReward);
      const taskDoc = buildTask(csvData[i], rewards, realReward);
      tasksToInsert.push(taskDoc);
    }

    await Task.insertMany(tasksToInsert);

    // Verify all tasks
    const allTasks = await Task.find({}).sort({ taskId: 1 });
    expect(allTasks).toHaveLength(3);

    // Count tasks with and without taskCheck
    const tasksWithCheck = allTasks.filter(t => t.taskCheck !== null);
    const tasksWithoutCheck = allTasks.filter(t => t.taskCheck === null);

    expect(tasksWithCheck).toHaveLength(2); // Tasks 1 and 2
    expect(tasksWithoutCheck).toHaveLength(1); // Task 3
  });

  test('TC-INT06: taskCheck field is included in task document structure', async () => {
    // Create required category
    await Category.create({ name: 'Spiritual', icon: '🧘' });

    // Parse CSV and import first task
    const csvData = parseCSV(testCsvPath);
    const rewards = parseVirtualReward(csvData[0].taskVirtualReward);
    const realReward = parseRealReward(csvData[0].taskRealReward);
    const taskDoc = buildTask(csvData[0], rewards, realReward);

    await Task.create(taskDoc);

    // Retrieve task as plain object
    const retrievedTask = await Task.findOne({ taskId: '1' }).lean();

    // Verify all expected fields are present
    expect(retrievedTask).toHaveProperty('taskId');
    expect(retrievedTask).toHaveProperty('title');
    expect(retrievedTask).toHaveProperty('description');
    expect(retrievedTask).toHaveProperty('category');
    expect(retrievedTask).toHaveProperty('xpReward');
    expect(retrievedTask).toHaveProperty('currencyReward');
    expect(retrievedTask).toHaveProperty('cooldown');
    expect(retrievedTask).toHaveProperty('requiresVerification');
    expect(retrievedTask).toHaveProperty('isActive');
    expect(retrievedTask).toHaveProperty('realReward');
    expect(retrievedTask).toHaveProperty('taskCheck');

    // Verify taskCheck has correct value
    expect(retrievedTask.taskCheck).toBe('Write a short reflection on your experience.');
  });
});
