/**
 * END-TO-END TEST — CSV Import Script with taskCheck field
 * Run: npx jest tests/csvImport.e2e.test.js
 * 
 * This test verifies the complete CSV import workflow using real CSV data:
 * - Verifies CSV parser extracts taskCheck correctly
 * - Verifies Task Builder includes taskCheck in documents
 * - Verifies Import Script saves taskCheck to database
 * - Verifies tasks can be queried by taskCheck presence
 * 
 * Requirements Coverage: 3.1, 3.2, 3.3, 3.4
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
const { ensureAllCategories } = require('../src/utils/categoryManager');

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

describe('CSV Import E2E - taskCheck field', () => {
  const testCsvPath = path.join(__dirname, 'test-import.csv');

  beforeEach(() => {
    // Create a realistic test CSV with various taskCheck scenarios
    const csvContent = `Task ID,Task Name,Task Category,Task Description,Task Check,Task Virtual Reward,Task Real Reward
T001,Meditate on humanity's future,Spiritual,Meditate on humanity's future among the stars.,Write a short reflection on your experience.,"101 XP, 21 coins",None
T002,Design a futuristic city,Creative,Design a futuristic city on Mars.,Upload a digital or physical sketch of your design.,"102 XP, 22 coins",None
T003,Train your body,Fitness,Train your body to endure long-duration spaceflight.,Log 30 minutes of endurance training.,"103 XP, 23 coins",None
T004,Map interstellar route,Exploration,Map out a theoretical interstellar trade route.,,"104 XP, 24 coins",None
T005,Draft constitution,Governance,Draft a constitution for the first human colony.,Share a written draft for peer review.,"140 XP, 25 coins",None
T006,Build life support,Engineering,Build a working model of a closed-loop life support system.,,"160 XP, 30 coins",None`;

    fs.writeFileSync(testCsvPath, csvContent, 'utf-8');
  });

  afterEach(() => {
    if (fs.existsSync(testCsvPath)) {
      fs.unlinkSync(testCsvPath);
    }
  });

  test('TC-E2E01: Complete import workflow with taskCheck field', async () => {
    // Step 1: Parse CSV
    const csvData = parseCSV(testCsvPath);
    expect(csvData).toHaveLength(6);

    // Step 2: Extract and create categories
    const uniqueCategories = [...new Set(csvData.map(row => row.taskCategory))];
    const categoryMap = await ensureAllCategories(uniqueCategories);
    expect(categoryMap.size).toBe(6);

    // Step 3: Build task documents
    const tasksToInsert = [];
    for (const row of csvData) {
      const rewards = parseVirtualReward(row.taskVirtualReward);
      const realReward = parseRealReward(row.taskRealReward);
      const taskDoc = buildTask(row, rewards, realReward);
      tasksToInsert.push(taskDoc);
    }

    expect(tasksToInsert).toHaveLength(6);

    // Step 4: Insert tasks into database
    await Task.insertMany(tasksToInsert);

    // Step 5: Verify all tasks were imported
    const allTasks = await Task.find({}).sort({ taskId: 1 });
    expect(allTasks).toHaveLength(6);

    // Step 6: Verify taskCheck values
    expect(allTasks[0].taskCheck).toBe('Write a short reflection on your experience.');
    expect(allTasks[1].taskCheck).toBe('Upload a digital or physical sketch of your design.');
    expect(allTasks[2].taskCheck).toBe('Log 30 minutes of endurance training.');
    expect(allTasks[3].taskCheck).toBeNull(); // Empty in CSV
    expect(allTasks[4].taskCheck).toBe('Share a written draft for peer review.');
    expect(allTasks[5].taskCheck).toBeNull(); // Empty in CSV
  });

  test('TC-E2E02: Query tasks with taskCheck values', async () => {
    // Import tasks
    const csvData = parseCSV(testCsvPath);
    await ensureAllCategories([...new Set(csvData.map(row => row.taskCategory))]);

    const tasksToInsert = [];
    for (const row of csvData) {
      const rewards = parseVirtualReward(row.taskVirtualReward);
      const realReward = parseRealReward(row.taskRealReward);
      const taskDoc = buildTask(row, rewards, realReward);
      tasksToInsert.push(taskDoc);
    }
    await Task.insertMany(tasksToInsert);

    // Query tasks with taskCheck (not null)
    const tasksWithCheck = await Task.find({ taskCheck: { $ne: null } });
    expect(tasksWithCheck).toHaveLength(4);

    // Query tasks without taskCheck (null)
    const tasksWithoutCheck = await Task.find({ taskCheck: null });
    expect(tasksWithoutCheck).toHaveLength(2);
  });

  test('TC-E2E03: Verify taskCheck with requiresVerification correlation', async () => {
    // Import tasks
    const csvData = parseCSV(testCsvPath);
    await ensureAllCategories([...new Set(csvData.map(row => row.taskCategory))]);

    const tasksToInsert = [];
    for (const row of csvData) {
      const rewards = parseVirtualReward(row.taskVirtualReward);
      const realReward = parseRealReward(row.taskRealReward);
      const taskDoc = buildTask(row, rewards, realReward);
      tasksToInsert.push(taskDoc);
    }
    await Task.insertMany(tasksToInsert);

    // Find tasks that require verification (XP >= 140)
    const verificationTasks = await Task.find({ requiresVerification: true });
    expect(verificationTasks.length).toBeGreaterThan(0);

    // Note: taskCheck and requiresVerification are independent
    // A task can require verification but have no taskCheck (and vice versa)
    const verificationWithCheck = verificationTasks.filter(t => t.taskCheck !== null);
    const verificationWithoutCheck = verificationTasks.filter(t => t.taskCheck === null);

    // Task T005 (140 XP) requires verification and has taskCheck
    const task5 = await Task.findOne({ taskId: 'T005' });
    expect(task5.requiresVerification).toBe(true);
    expect(task5.taskCheck).toBe('Share a written draft for peer review.');

    // Task T006 (160 XP) requires verification but has no taskCheck
    const task6 = await Task.findOne({ taskId: 'T006' });
    expect(task6.requiresVerification).toBe(true);
    expect(task6.taskCheck).toBeNull();
  });

  test('TC-E2E04: Verify taskCheck is returned in API-like queries', async () => {
    // Import tasks
    const csvData = parseCSV(testCsvPath);
    await ensureAllCategories([...new Set(csvData.map(row => row.taskCategory))]);

    const tasksToInsert = [];
    for (const row of csvData) {
      const rewards = parseVirtualReward(row.taskVirtualReward);
      const realReward = parseRealReward(row.taskRealReward);
      const taskDoc = buildTask(row, rewards, realReward);
      tasksToInsert.push(taskDoc);
    }
    await Task.insertMany(tasksToInsert);

    // Simulate API query (lean returns plain objects)
    const apiResponse = await Task.find({}).select('taskId title taskCheck').lean();

    expect(apiResponse).toHaveLength(6);
    
    // Verify each task has taskCheck field (even if null)
    apiResponse.forEach(task => {
      expect(task).toHaveProperty('taskCheck');
    });

    // Verify specific values
    const task1 = apiResponse.find(t => t.taskId === 'T001');
    expect(task1.taskCheck).toBe('Write a short reflection on your experience.');

    const task4 = apiResponse.find(t => t.taskId === 'T004');
    expect(task4.taskCheck).toBeNull();
  });

  test('TC-E2E05: Verify taskCheck with category filtering', async () => {
    // Import tasks
    const csvData = parseCSV(testCsvPath);
    await ensureAllCategories([...new Set(csvData.map(row => row.taskCategory))]);

    const tasksToInsert = [];
    for (const row of csvData) {
      const rewards = parseVirtualReward(row.taskVirtualReward);
      const realReward = parseRealReward(row.taskRealReward);
      const taskDoc = buildTask(row, rewards, realReward);
      tasksToInsert.push(taskDoc);
    }
    await Task.insertMany(tasksToInsert);

    // Query tasks by category
    const spiritualTasks = await Task.find({ category: 'Spiritual' });
    expect(spiritualTasks).toHaveLength(1);
    expect(spiritualTasks[0].taskCheck).toBe('Write a short reflection on your experience.');

    const explorationTasks = await Task.find({ category: 'Exploration' });
    expect(explorationTasks).toHaveLength(1);
    expect(explorationTasks[0].taskCheck).toBeNull();
  });

  test('TC-E2E06: Verify empty Task Check column results in null taskCheck', async () => {
    // Import tasks
    const csvData = parseCSV(testCsvPath);
    await ensureAllCategories([...new Set(csvData.map(row => row.taskCategory))]);

    const tasksToInsert = [];
    for (const row of csvData) {
      const rewards = parseVirtualReward(row.taskVirtualReward);
      const realReward = parseRealReward(row.taskRealReward);
      const taskDoc = buildTask(row, rewards, realReward);
      tasksToInsert.push(taskDoc);
    }
    await Task.insertMany(tasksToInsert);

    // Verify tasks with empty Task Check column have null taskCheck
    const task4 = await Task.findOne({ taskId: 'T004' });
    expect(task4.taskCheck).toBeNull();
    expect(task4.title).toBe('Map interstellar route');

    const task6 = await Task.findOne({ taskId: 'T006' });
    expect(task6.taskCheck).toBeNull();
    expect(task6.title).toBe('Build life support');
  });
});
