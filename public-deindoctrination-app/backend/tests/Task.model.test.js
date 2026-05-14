/**
 * UNIT TESTS — Task Model with taskCheck field
 * Run: npx jest tests/Task.model.test.js
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Task = require('../src/models/Task');

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
});

describe('Task Model - taskCheck field', () => {
  test('TC-M01: creates task with taskCheck value', async () => {
    const taskData = {
      taskId: 'test-001',
      title: 'Test Task',
      description: 'Test description',
      category: 'Critical Thinking',
      xpReward: 100,
      currencyReward: 50,
      cooldown: 3600,
      taskCheck: 'Write a short reflection on your experience'
    };

    const task = new Task(taskData);
    const savedTask = await task.save();

    expect(savedTask.taskCheck).toBe('Write a short reflection on your experience');
    expect(savedTask.taskId).toBe('test-001');
  });

  test('TC-M02: creates task without taskCheck (defaults to null)', async () => {
    const taskData = {
      taskId: 'test-002',
      title: 'Test Task',
      description: 'Test description',
      category: 'Critical Thinking',
      xpReward: 100,
      currencyReward: 50,
      cooldown: 3600
    };

    const task = new Task(taskData);
    const savedTask = await task.save();

    expect(savedTask.taskCheck).toBeNull();
  });

  test('TC-M03: saves and retrieves taskCheck from database', async () => {
    const taskData = {
      taskId: 'test-003',
      title: 'Test Task',
      description: 'Test description',
      category: 'Critical Thinking',
      xpReward: 100,
      currencyReward: 50,
      cooldown: 3600,
      taskCheck: 'Upload a digital or physical sketch of your design'
    };

    const task = new Task(taskData);
    await task.save();

    const retrievedTask = await Task.findOne({ taskId: 'test-003' });
    expect(retrievedTask.taskCheck).toBe('Upload a digital or physical sketch of your design');
  });

  test('TC-M04: taskCheck field is optional (not required)', async () => {
    const taskData = {
      taskId: 'test-004',
      title: 'Test Task',
      description: 'Test description',
      category: 'Critical Thinking',
      xpReward: 100,
      currencyReward: 50,
      cooldown: 3600
    };

    const task = new Task(taskData);
    await expect(task.save()).resolves.toBeDefined();
  });

  test('TC-M05: taskCheck can be set to null explicitly', async () => {
    const taskData = {
      taskId: 'test-005',
      title: 'Test Task',
      description: 'Test description',
      category: 'Critical Thinking',
      xpReward: 100,
      currencyReward: 50,
      cooldown: 3600,
      taskCheck: null
    };

    const task = new Task(taskData);
    const savedTask = await task.save();

    expect(savedTask.taskCheck).toBeNull();
  });

  test('TC-M06: taskCheck can be updated', async () => {
    const taskData = {
      taskId: 'test-006',
      title: 'Test Task',
      description: 'Test description',
      category: 'Critical Thinking',
      xpReward: 100,
      currencyReward: 50,
      cooldown: 3600,
      taskCheck: 'Initial verification instructions'
    };

    const task = new Task(taskData);
    await task.save();

    task.taskCheck = 'Updated verification instructions';
    const updatedTask = await task.save();

    expect(updatedTask.taskCheck).toBe('Updated verification instructions');
  });

  test('TC-M07: taskCheck accepts empty string', async () => {
    const taskData = {
      taskId: 'test-007',
      title: 'Test Task',
      description: 'Test description',
      category: 'Critical Thinking',
      xpReward: 100,
      currencyReward: 50,
      cooldown: 3600,
      taskCheck: ''
    };

    const task = new Task(taskData);
    const savedTask = await task.save();

    expect(savedTask.taskCheck).toBe('');
  });

  test('TC-M08: taskCheck accepts multi-line text', async () => {
    const multiLineCheck = `Step 1: Complete the exercise
Step 2: Take a photo
Step 3: Write a reflection`;

    const taskData = {
      taskId: 'test-008',
      title: 'Test Task',
      description: 'Test description',
      category: 'Critical Thinking',
      xpReward: 100,
      currencyReward: 50,
      cooldown: 3600,
      taskCheck: multiLineCheck
    };

    const task = new Task(taskData);
    const savedTask = await task.save();

    expect(savedTask.taskCheck).toBe(multiLineCheck);
  });
});
