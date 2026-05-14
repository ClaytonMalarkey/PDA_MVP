/**
 * INTEGRATION TESTS — Admin Dashboard taskCheck Edit Workflow (Task 6.3)
 * Run: npx jest tests/adminDashboard.taskCheck.integration.test.js
 * 
 * Tests verify that the Admin Dashboard can create and edit tasks with taskCheck values.
 * This test covers Requirements 5.1, 5.2, 5.3, 5.4 from the task-check-field spec.
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Task = require('../src/models/Task');
const { createTask, updateTask, getAllTasks } = require('../src/controllers/adminController');

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
const mockRequest = (params = {}, body = {}) => ({
  params,
  body
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Admin Dashboard - taskCheck Edit Workflow (Task 6.3)', () => {
  describe('Create new task with taskCheck', () => {
    test('TC-6.3-01: creates a new task with taskCheck value and verifies it is saved', async () => {
      // Simulate Admin Dashboard creating a new task with taskCheck
      const req = mockRequest({}, {
        taskId: 'dashboard-create-001',
        title: 'New Task with Verification',
        description: 'This task requires verification',
        category: 'Critical Thinking',
        xpReward: 100,
        currencyReward: 50,
        cooldown: 3600000,
        requiresVerification: true,
        taskCheck: 'Write a short reflection on your experience'
      });
      const res = mockResponse();

      // Call createTask (simulating API call from Admin Dashboard)
      await createTask(req, res);

      // Verify response
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      const createdTask = res.json.mock.calls[0][0];
      
      expect(createdTask.taskId).toBe('dashboard-create-001');
      expect(createdTask.taskCheck).toBe('Write a short reflection on your experience');

      // Verify task is saved in database
      const dbTask = await Task.findOne({ taskId: 'dashboard-create-001' });
      expect(dbTask).not.toBeNull();
      expect(dbTask.taskCheck).toBe('Write a short reflection on your experience');
    });

    test('TC-6.3-02: creates a new task with empty taskCheck (should save as empty string)', async () => {
      // Simulate Admin Dashboard creating a task with empty taskCheck field
      const req = mockRequest({}, {
        taskId: 'dashboard-create-002',
        title: 'Task without Verification',
        description: 'This task does not require verification',
        category: 'Physical Health',
        xpReward: 75,
        currencyReward: 25,
        cooldown: 3600000,
        requiresVerification: false,
        taskCheck: '' // Empty string from form
      });
      const res = mockResponse();

      // Call createTask
      await createTask(req, res);

      // Verify response
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      const createdTask = res.json.mock.calls[0][0];
      
      expect(createdTask.taskId).toBe('dashboard-create-002');
      expect(createdTask.taskCheck).toBe('');

      // Verify task is saved in database
      const dbTask = await Task.findOne({ taskId: 'dashboard-create-002' });
      expect(dbTask).not.toBeNull();
      expect(dbTask.taskCheck).toBe('');
    });

    test('TC-6.3-03: creates a new task with multi-line taskCheck', async () => {
      const multiLineCheck = `Step 1: Complete the exercise
Step 2: Take a photo of your work
Step 3: Write a brief reflection`;

      // Simulate Admin Dashboard creating a task with multi-line taskCheck
      const req = mockRequest({}, {
        taskId: 'dashboard-create-003',
        title: 'Multi-step Task',
        description: 'This task has multiple verification steps',
        category: 'Emotional Intelligence',
        xpReward: 150,
        currencyReward: 75,
        cooldown: 7200000,
        requiresVerification: true,
        taskCheck: multiLineCheck
      });
      const res = mockResponse();

      // Call createTask
      await createTask(req, res);

      // Verify response
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      const createdTask = res.json.mock.calls[0][0];
      
      expect(createdTask.taskCheck).toBe(multiLineCheck);

      // Verify task is saved in database
      const dbTask = await Task.findOne({ taskId: 'dashboard-create-003' });
      expect(dbTask).not.toBeNull();
      expect(dbTask.taskCheck).toBe(multiLineCheck);
    });
  });

  describe('Edit existing task and modify taskCheck', () => {
    test('TC-6.3-04: edits an existing task and modifies taskCheck field', async () => {
      // Create initial task
      const task = await Task.create({
        taskId: 'dashboard-edit-001',
        title: 'Original Task',
        description: 'Original description',
        category: 'Critical Thinking',
        xpReward: 100,
        currencyReward: 50,
        cooldown: 3600000,
        taskCheck: 'Original verification instructions'
      });

      // Simulate Admin Dashboard editing the task and changing taskCheck
      const req = mockRequest(
        { id: task._id.toString() },
        {
          taskId: 'dashboard-edit-001',
          title: 'Original Task',
          description: 'Original description',
          category: 'Critical Thinking',
          xpReward: 100,
          currencyReward: 50,
          cooldown: 3600000,
          taskCheck: 'Updated verification instructions'
        }
      );
      const res = mockResponse();

      // Call updateTask (simulating API call from Admin Dashboard)
      await updateTask(req, res);

      // Verify response
      expect(res.json).toHaveBeenCalled();
      const updatedTask = res.json.mock.calls[0][0];
      expect(updatedTask.taskCheck).toBe('Updated verification instructions');

      // Verify taskCheck is updated in database
      const dbTask = await Task.findById(task._id);
      expect(dbTask.taskCheck).toBe('Updated verification instructions');
    });

    test('TC-6.3-05: edits task to add taskCheck where none existed', async () => {
      // Create initial task without taskCheck
      const task = await Task.create({
        taskId: 'dashboard-edit-002',
        title: 'Task without Check',
        description: 'No verification initially',
        category: 'Physical Health',
        xpReward: 75,
        currencyReward: 25,
        cooldown: 3600000
        // No taskCheck field
      });

      // Verify initial state
      expect(task.taskCheck).toBeNull();

      // Simulate Admin Dashboard editing the task to add taskCheck
      const req = mockRequest(
        { id: task._id.toString() },
        {
          taskCheck: 'Newly added verification instructions'
        }
      );
      const res = mockResponse();

      // Call updateTask
      await updateTask(req, res);

      // Verify response
      expect(res.json).toHaveBeenCalled();
      const updatedTask = res.json.mock.calls[0][0];
      expect(updatedTask.taskCheck).toBe('Newly added verification instructions');

      // Verify taskCheck is added in database
      const dbTask = await Task.findById(task._id);
      expect(dbTask.taskCheck).toBe('Newly added verification instructions');
    });

    test('TC-6.3-06: edits task to remove taskCheck (set to empty string)', async () => {
      // Create initial task with taskCheck
      const task = await Task.create({
        taskId: 'dashboard-edit-003',
        title: 'Task with Check',
        description: 'Has verification initially',
        category: 'Emotional Intelligence',
        xpReward: 150,
        currencyReward: 75,
        cooldown: 7200000,
        taskCheck: 'Original verification instructions'
      });

      // Simulate Admin Dashboard editing the task to remove taskCheck
      const req = mockRequest(
        { id: task._id.toString() },
        {
          taskCheck: '' // User cleared the field
        }
      );
      const res = mockResponse();

      // Call updateTask
      await updateTask(req, res);

      // Verify response
      expect(res.json).toHaveBeenCalled();
      const updatedTask = res.json.mock.calls[0][0];
      expect(updatedTask.taskCheck).toBe('');

      // Verify taskCheck is removed in database
      const dbTask = await Task.findById(task._id);
      expect(dbTask.taskCheck).toBe('');
    });

    test('TC-6.3-07: edits task to change taskCheck from one value to another', async () => {
      // Create initial task with taskCheck
      const task = await Task.create({
        taskId: 'dashboard-edit-004',
        title: 'Task to Modify',
        description: 'Will change verification',
        category: 'Critical Thinking',
        xpReward: 100,
        currencyReward: 50,
        cooldown: 3600000,
        taskCheck: 'Upload a photo of your work'
      });

      // Simulate Admin Dashboard editing the task to change taskCheck
      const req = mockRequest(
        { id: task._id.toString() },
        {
          taskCheck: 'Write a detailed reflection instead'
        }
      );
      const res = mockResponse();

      // Call updateTask
      await updateTask(req, res);

      // Verify response
      expect(res.json).toHaveBeenCalled();
      const updatedTask = res.json.mock.calls[0][0];
      expect(updatedTask.taskCheck).toBe('Write a detailed reflection instead');

      // Verify taskCheck is changed in database
      const dbTask = await Task.findById(task._id);
      expect(dbTask.taskCheck).toBe('Write a detailed reflection instead');
    });
  });

  describe('End-to-end workflow: Create, Edit, Retrieve', () => {
    test('TC-6.3-08: complete workflow - create task, edit taskCheck, retrieve and verify', async () => {
      // Step 1: Create a new task with taskCheck
      const createReq = mockRequest({}, {
        taskId: 'dashboard-workflow-001',
        title: 'Workflow Test Task',
        description: 'Testing complete workflow',
        category: 'Critical Thinking',
        xpReward: 100,
        currencyReward: 50,
        cooldown: 3600000,
        taskCheck: 'Initial verification instructions'
      });
      const createRes = mockResponse();

      await createTask(createReq, createRes);

      expect(createRes.status).toHaveBeenCalledWith(201);
      const createdTask = createRes.json.mock.calls[0][0];
      expect(createdTask.taskCheck).toBe('Initial verification instructions');

      // Step 2: Edit the task to modify taskCheck
      const updateReq = mockRequest(
        { id: createdTask._id.toString() },
        {
          taskCheck: 'Modified verification instructions'
        }
      );
      const updateRes = mockResponse();

      await updateTask(updateReq, updateRes);

      const updatedTask = updateRes.json.mock.calls[0][0];
      expect(updatedTask.taskCheck).toBe('Modified verification instructions');

      // Step 3: Retrieve all tasks and verify taskCheck is displayed
      const getAllReq = mockRequest();
      const getAllRes = mockResponse();

      await getAllTasks(getAllReq, getAllRes);

      const allTasks = getAllRes.json.mock.calls[0][0];
      const retrievedTask = allTasks.find(t => t.taskId === 'dashboard-workflow-001');
      
      expect(retrievedTask).toBeDefined();
      expect(retrievedTask.taskCheck).toBe('Modified verification instructions');

      // Step 4: Verify database state
      const dbTask = await Task.findById(createdTask._id);
      expect(dbTask.taskCheck).toBe('Modified verification instructions');
    });

    test('TC-6.3-09: workflow with multiple tasks - verify taskCheck independence', async () => {
      // Create multiple tasks with different taskCheck values
      const task1Req = mockRequest({}, {
        taskId: 'multi-001',
        title: 'Task 1',
        description: 'First task',
        category: 'Critical Thinking',
        xpReward: 100,
        currencyReward: 50,
        cooldown: 3600000,
        taskCheck: 'Verification for task 1'
      });
      const task1Res = mockResponse();
      await createTask(task1Req, task1Res);
      const task1 = task1Res.json.mock.calls[0][0];

      const task2Req = mockRequest({}, {
        taskId: 'multi-002',
        title: 'Task 2',
        description: 'Second task',
        category: 'Physical Health',
        xpReward: 75,
        currencyReward: 25,
        cooldown: 3600000,
        taskCheck: 'Verification for task 2'
      });
      const task2Res = mockResponse();
      await createTask(task2Req, task2Res);
      const task2 = task2Res.json.mock.calls[0][0];

      // Edit only task 1's taskCheck
      const updateReq = mockRequest(
        { id: task1._id.toString() },
        {
          taskCheck: 'Updated verification for task 1'
        }
      );
      const updateRes = mockResponse();
      await updateTask(updateReq, updateRes);

      // Retrieve all tasks
      const getAllReq = mockRequest();
      const getAllRes = mockResponse();
      await getAllTasks(getAllReq, getAllRes);

      const allTasks = getAllRes.json.mock.calls[0][0];
      const retrievedTask1 = allTasks.find(t => t.taskId === 'multi-001');
      const retrievedTask2 = allTasks.find(t => t.taskId === 'multi-002');

      // Verify task 1 was updated
      expect(retrievedTask1.taskCheck).toBe('Updated verification for task 1');
      
      // Verify task 2 was NOT affected
      expect(retrievedTask2.taskCheck).toBe('Verification for task 2');
    });
  });

  describe('Edge cases and validation', () => {
    test('TC-6.3-10: handles very long taskCheck text', async () => {
      const longText = 'A'.repeat(1000); // 1000 character string

      const req = mockRequest({}, {
        taskId: 'edge-001',
        title: 'Long Text Task',
        description: 'Task with long taskCheck',
        category: 'Critical Thinking',
        xpReward: 100,
        currencyReward: 50,
        cooldown: 3600000,
        taskCheck: longText
      });
      const res = mockResponse();

      await createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const createdTask = res.json.mock.calls[0][0];
      expect(createdTask.taskCheck).toBe(longText);
      expect(createdTask.taskCheck.length).toBe(1000);
    });

    test('TC-6.3-11: handles special characters in taskCheck', async () => {
      const specialChars = 'Test with special chars: @#$%^&*()_+-=[]{}|;:\'",.<>?/\\`~';

      const req = mockRequest({}, {
        taskId: 'edge-002',
        title: 'Special Chars Task',
        description: 'Task with special characters',
        category: 'Critical Thinking',
        xpReward: 100,
        currencyReward: 50,
        cooldown: 3600000,
        taskCheck: specialChars
      });
      const res = mockResponse();

      await createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const createdTask = res.json.mock.calls[0][0];
      expect(createdTask.taskCheck).toBe(specialChars);
    });

    test('TC-6.3-12: handles Unicode characters in taskCheck', async () => {
      const unicodeText = 'Test with emoji 😀 and unicode: 你好 مرحبا';

      const req = mockRequest({}, {
        taskId: 'edge-003',
        title: 'Unicode Task',
        description: 'Task with unicode',
        category: 'Critical Thinking',
        xpReward: 100,
        currencyReward: 50,
        cooldown: 3600000,
        taskCheck: unicodeText
      });
      const res = mockResponse();

      await createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const createdTask = res.json.mock.calls[0][0];
      expect(createdTask.taskCheck).toBe(unicodeText);
    });
  });
});
