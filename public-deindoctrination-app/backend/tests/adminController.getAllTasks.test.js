/**
 * INTEGRATION TESTS — Admin Controller getAllTasks with taskCheck field
 * Run: npx jest tests/adminController.getAllTasks.test.js
 * 
 * Tests verify that the getAllTasks API endpoint properly returns taskCheck field.
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Task = require('../src/models/Task');
const { getAllTasks } = require('../src/controllers/adminController');

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

// Mock Express request and response objects
const mockRequest = () => ({});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Admin Controller - getAllTasks with taskCheck', () => {
  test('TC-GT01: returns taskCheck field for tasks with taskCheck values', async () => {
    // Create tasks with taskCheck values
    await Task.create([
      {
        taskId: 'test-get-001',
        title: 'Task 1',
        description: 'Description 1',
        category: 'Critical Thinking',
        xpReward: 100,
        currencyReward: 50,
        cooldown: 3600,
        taskCheck: 'Write a short reflection on your experience'
      },
      {
        taskId: 'test-get-002',
        title: 'Task 2',
        description: 'Description 2',
        category: 'Physical Health',
        xpReward: 150,
        currencyReward: 75,
        cooldown: 7200,
        taskCheck: 'Upload a photo of your completed exercise'
      }
    ]);

    // Mock request and response
    const req = mockRequest();
    const res = mockResponse();

    // Call getAllTasks
    await getAllTasks(req, res);

    // Verify response
    expect(res.json).toHaveBeenCalled();
    const tasks = res.json.mock.calls[0][0];
    
    expect(tasks).toHaveLength(2);
    expect(tasks[0].taskCheck).toBeDefined();
    expect(tasks[1].taskCheck).toBeDefined();
    
    // Verify taskCheck values are returned
    const task1 = tasks.find(t => t.taskId === 'test-get-001');
    const task2 = tasks.find(t => t.taskId === 'test-get-002');
    
    expect(task1.taskCheck).toBe('Write a short reflection on your experience');
    expect(task2.taskCheck).toBe('Upload a photo of your completed exercise');
  });

  test('TC-GT02: returns null taskCheck for tasks without taskCheck values', async () => {
    // Create tasks without taskCheck values
    await Task.create([
      {
        taskId: 'test-get-003',
        title: 'Task 3',
        description: 'Description 3',
        category: 'Critical Thinking',
        xpReward: 100,
        currencyReward: 50,
        cooldown: 3600
        // taskCheck not provided, should default to null
      },
      {
        taskId: 'test-get-004',
        title: 'Task 4',
        description: 'Description 4',
        category: 'Physical Health',
        xpReward: 150,
        currencyReward: 75,
        cooldown: 7200,
        taskCheck: null
      }
    ]);

    // Mock request and response
    const req = mockRequest();
    const res = mockResponse();

    // Call getAllTasks
    await getAllTasks(req, res);

    // Verify response
    expect(res.json).toHaveBeenCalled();
    const tasks = res.json.mock.calls[0][0];
    
    expect(tasks).toHaveLength(2);
    
    // Verify taskCheck is null for both tasks
    const task3 = tasks.find(t => t.taskId === 'test-get-003');
    const task4 = tasks.find(t => t.taskId === 'test-get-004');
    
    expect(task3.taskCheck).toBeNull();
    expect(task4.taskCheck).toBeNull();
  });

  test('TC-GT03: returns mixed tasks with and without taskCheck values', async () => {
    // Create mix of tasks
    await Task.create([
      {
        taskId: 'test-get-005',
        title: 'Task 5',
        description: 'Description 5',
        category: 'Critical Thinking',
        xpReward: 100,
        currencyReward: 50,
        cooldown: 3600,
        taskCheck: 'Complete the quiz and submit your answers'
      },
      {
        taskId: 'test-get-006',
        title: 'Task 6',
        description: 'Description 6',
        category: 'Physical Health',
        xpReward: 150,
        currencyReward: 75,
        cooldown: 7200
        // No taskCheck
      },
      {
        taskId: 'test-get-007',
        title: 'Task 7',
        description: 'Description 7',
        category: 'Emotional Intelligence',
        xpReward: 200,
        currencyReward: 100,
        cooldown: 10800,
        taskCheck: 'Journal about your feelings for 10 minutes'
      }
    ]);

    // Mock request and response
    const req = mockRequest();
    const res = mockResponse();

    // Call getAllTasks
    await getAllTasks(req, res);

    // Verify response
    expect(res.json).toHaveBeenCalled();
    const tasks = res.json.mock.calls[0][0];
    
    expect(tasks).toHaveLength(3);
    
    // Verify each task's taskCheck
    const task5 = tasks.find(t => t.taskId === 'test-get-005');
    const task6 = tasks.find(t => t.taskId === 'test-get-006');
    const task7 = tasks.find(t => t.taskId === 'test-get-007');
    
    expect(task5.taskCheck).toBe('Complete the quiz and submit your answers');
    expect(task6.taskCheck).toBeNull();
    expect(task7.taskCheck).toBe('Journal about your feelings for 10 minutes');
  });

  test('TC-GT04: returns taskCheck with multi-line text', async () => {
    const multiLineCheck = `Step 1: Complete the exercise
Step 2: Take a photo
Step 3: Write a reflection`;

    // Create task with multi-line taskCheck
    await Task.create({
      taskId: 'test-get-008',
      title: 'Task 8',
      description: 'Description 8',
      category: 'Critical Thinking',
      xpReward: 100,
      currencyReward: 50,
      cooldown: 3600,
      taskCheck: multiLineCheck
    });

    // Mock request and response
    const req = mockRequest();
    const res = mockResponse();

    // Call getAllTasks
    await getAllTasks(req, res);

    // Verify response
    expect(res.json).toHaveBeenCalled();
    const tasks = res.json.mock.calls[0][0];
    
    expect(tasks).toHaveLength(1);
    expect(tasks[0].taskCheck).toBe(multiLineCheck);
  });

  test('TC-GT05: returns empty array when no tasks exist', async () => {
    // No tasks created

    // Mock request and response
    const req = mockRequest();
    const res = mockResponse();

    // Call getAllTasks
    await getAllTasks(req, res);

    // Verify response
    expect(res.json).toHaveBeenCalled();
    const tasks = res.json.mock.calls[0][0];
    
    expect(tasks).toHaveLength(0);
    expect(tasks).toEqual([]);
  });

  test('TC-GT06: returns taskCheck alongside all other task fields', async () => {
    // Create task with all fields
    await Task.create({
      taskId: 'test-get-009',
      title: 'Complete Task',
      description: 'Full description',
      category: 'Critical Thinking',
      xpReward: 100,
      currencyReward: 50,
      cooldown: 3600,
      requiresVerification: true,
      isActive: true,
      realReward: 'Gift card',
      taskCheck: 'Submit your completed work'
    });

    // Mock request and response
    const req = mockRequest();
    const res = mockResponse();

    // Call getAllTasks
    await getAllTasks(req, res);

    // Verify response
    expect(res.json).toHaveBeenCalled();
    const tasks = res.json.mock.calls[0][0];
    
    expect(tasks).toHaveLength(1);
    const task = tasks[0];
    
    // Verify all fields are present
    expect(task.taskId).toBe('test-get-009');
    expect(task.title).toBe('Complete Task');
    expect(task.description).toBe('Full description');
    expect(task.category).toBe('Critical Thinking');
    expect(task.xpReward).toBe(100);
    expect(task.currencyReward).toBe(50);
    expect(task.cooldown).toBe(3600);
    expect(task.requiresVerification).toBe(true);
    expect(task.isActive).toBe(true);
    expect(task.realReward).toBe('Gift card');
    expect(task.taskCheck).toBe('Submit your completed work');
  });

  test('TC-GT07: returns tasks sorted by createdAt descending', async () => {
    // Create tasks with slight delays to ensure different timestamps
    const task1 = await Task.create({
      taskId: 'test-get-010',
      title: 'First Task',
      description: 'Description',
      category: 'Critical Thinking',
      xpReward: 100,
      currencyReward: 50,
      cooldown: 3600,
      taskCheck: 'First check'
    });

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const task2 = await Task.create({
      taskId: 'test-get-011',
      title: 'Second Task',
      description: 'Description',
      category: 'Physical Health',
      xpReward: 150,
      currencyReward: 75,
      cooldown: 7200,
      taskCheck: 'Second check'
    });

    // Mock request and response
    const req = mockRequest();
    const res = mockResponse();

    // Call getAllTasks
    await getAllTasks(req, res);

    // Verify response
    expect(res.json).toHaveBeenCalled();
    const tasks = res.json.mock.calls[0][0];
    
    expect(tasks).toHaveLength(2);
    
    // Verify tasks are sorted by createdAt descending (newest first)
    expect(tasks[0].taskId).toBe('test-get-011'); // Second task created
    expect(tasks[1].taskId).toBe('test-get-010'); // First task created
    
    // Verify taskCheck is present in sorted results
    expect(tasks[0].taskCheck).toBe('Second check');
    expect(tasks[1].taskCheck).toBe('First check');
  });
});
