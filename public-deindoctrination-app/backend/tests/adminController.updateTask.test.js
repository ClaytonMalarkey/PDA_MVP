/**
 * INTEGRATION TESTS — Admin Controller updateTask with taskCheck field
 * Run: npx jest tests/adminController.updateTask.test.js
 * 
 * Tests verify that the updateTask API endpoint properly handles taskCheck updates.
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Task = require('../src/models/Task');
const { updateTask } = require('../src/controllers/adminController');

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

describe('Admin Controller - updateTask with taskCheck', () => {
  test('TC-AC01: updates taskCheck field via API', async () => {
    // Create initial task
    const task = new Task({
      taskId: 'test-update-001',
      title: 'Test Task',
      description: 'Test description',
      category: 'Critical Thinking',
      xpReward: 100,
      currencyReward: 50,
      cooldown: 3600,
      taskCheck: 'Initial verification instructions'
    });
    await task.save();

    // Mock request to update taskCheck
    const req = mockRequest(
      { id: task._id.toString() },
      { taskCheck: 'Updated verification instructions' }
    );
    const res = mockResponse();

    // Call updateTask
    await updateTask(req, res);

    // Verify response
    expect(res.json).toHaveBeenCalled();
    const updatedTask = res.json.mock.calls[0][0];
    expect(updatedTask.taskCheck).toBe('Updated verification instructions');

    // Verify database
    const dbTask = await Task.findById(task._id);
    expect(dbTask.taskCheck).toBe('Updated verification instructions');
  });

  test('TC-AC02: updates taskCheck to null', async () => {
    // Create initial task with taskCheck
    const task = new Task({
      taskId: 'test-update-002',
      title: 'Test Task',
      description: 'Test description',
      category: 'Critical Thinking',
      xpReward: 100,
      currencyReward: 50,
      cooldown: 3600,
      taskCheck: 'Initial verification instructions'
    });
    await task.save();

    // Mock request to set taskCheck to null
    const req = mockRequest(
      { id: task._id.toString() },
      { taskCheck: null }
    );
    const res = mockResponse();

    // Call updateTask
    await updateTask(req, res);

    // Verify response
    expect(res.json).toHaveBeenCalled();
    const updatedTask = res.json.mock.calls[0][0];
    expect(updatedTask.taskCheck).toBeNull();

    // Verify database
    const dbTask = await Task.findById(task._id);
    expect(dbTask.taskCheck).toBeNull();
  });

  test('TC-AC03: updates taskCheck along with other fields', async () => {
    // Create initial task
    const task = new Task({
      taskId: 'test-update-003',
      title: 'Test Task',
      description: 'Test description',
      category: 'Critical Thinking',
      xpReward: 100,
      currencyReward: 50,
      cooldown: 3600,
      taskCheck: 'Initial verification instructions'
    });
    await task.save();

    // Mock request to update multiple fields including taskCheck
    const req = mockRequest(
      { id: task._id.toString() },
      {
        title: 'Updated Title',
        xpReward: 150,
        taskCheck: 'Updated verification instructions'
      }
    );
    const res = mockResponse();

    // Call updateTask
    await updateTask(req, res);

    // Verify response
    expect(res.json).toHaveBeenCalled();
    const updatedTask = res.json.mock.calls[0][0];
    expect(updatedTask.title).toBe('Updated Title');
    expect(updatedTask.xpReward).toBe(150);
    expect(updatedTask.taskCheck).toBe('Updated verification instructions');

    // Verify database
    const dbTask = await Task.findById(task._id);
    expect(dbTask.title).toBe('Updated Title');
    expect(dbTask.xpReward).toBe(150);
    expect(dbTask.taskCheck).toBe('Updated verification instructions');
  });

  test('TC-AC04: updates task without modifying taskCheck', async () => {
    // Create initial task
    const task = new Task({
      taskId: 'test-update-004',
      title: 'Test Task',
      description: 'Test description',
      category: 'Critical Thinking',
      xpReward: 100,
      currencyReward: 50,
      cooldown: 3600,
      taskCheck: 'Original verification instructions'
    });
    await task.save();

    // Mock request to update other fields (not taskCheck)
    const req = mockRequest(
      { id: task._id.toString() },
      { title: 'Updated Title' }
    );
    const res = mockResponse();

    // Call updateTask
    await updateTask(req, res);

    // Verify response
    expect(res.json).toHaveBeenCalled();
    const updatedTask = res.json.mock.calls[0][0];
    expect(updatedTask.title).toBe('Updated Title');
    expect(updatedTask.taskCheck).toBe('Original verification instructions');

    // Verify database
    const dbTask = await Task.findById(task._id);
    expect(dbTask.taskCheck).toBe('Original verification instructions');
  });

  test('TC-AC05: updates taskCheck to empty string', async () => {
    // Create initial task
    const task = new Task({
      taskId: 'test-update-005',
      title: 'Test Task',
      description: 'Test description',
      category: 'Critical Thinking',
      xpReward: 100,
      currencyReward: 50,
      cooldown: 3600,
      taskCheck: 'Initial verification instructions'
    });
    await task.save();

    // Mock request to set taskCheck to empty string
    const req = mockRequest(
      { id: task._id.toString() },
      { taskCheck: '' }
    );
    const res = mockResponse();

    // Call updateTask
    await updateTask(req, res);

    // Verify response
    expect(res.json).toHaveBeenCalled();
    const updatedTask = res.json.mock.calls[0][0];
    expect(updatedTask.taskCheck).toBe('');

    // Verify database
    const dbTask = await Task.findById(task._id);
    expect(dbTask.taskCheck).toBe('');
  });

  test('TC-AC06: handles non-existent task ID', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    
    // Mock request with non-existent ID
    const req = mockRequest(
      { id: fakeId.toString() },
      { taskCheck: 'New verification instructions' }
    );
    const res = mockResponse();

    // Call updateTask
    await updateTask(req, res);

    // Verify error response
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Task not found' });
  });

  test('TC-AC07: updates taskCheck with multi-line text', async () => {
    // Create initial task
    const task = new Task({
      taskId: 'test-update-007',
      title: 'Test Task',
      description: 'Test description',
      category: 'Critical Thinking',
      xpReward: 100,
      currencyReward: 50,
      cooldown: 3600,
      taskCheck: 'Initial verification instructions'
    });
    await task.save();

    const multiLineCheck = `Step 1: Complete the exercise
Step 2: Take a photo
Step 3: Write a reflection`;

    // Mock request to update taskCheck with multi-line text
    const req = mockRequest(
      { id: task._id.toString() },
      { taskCheck: multiLineCheck }
    );
    const res = mockResponse();

    // Call updateTask
    await updateTask(req, res);

    // Verify response
    expect(res.json).toHaveBeenCalled();
    const updatedTask = res.json.mock.calls[0][0];
    expect(updatedTask.taskCheck).toBe(multiLineCheck);

    // Verify database
    const dbTask = await Task.findById(task._id);
    expect(dbTask.taskCheck).toBe(multiLineCheck);
  });
});
