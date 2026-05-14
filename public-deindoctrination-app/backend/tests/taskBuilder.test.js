/**
 * UNIT TESTS — Task Builder with taskCheck field
 * Run: npx jest tests/taskBuilder.test.js
 */

const { buildTask, determineCooldown, requiresVerification } = require('../src/utils/taskBuilder');

describe('Task Builder - taskCheck handling', () => {
  const baseRewards = { xp: 100, coins: 50 };
  const baseCsvRow = {
    taskId: 'test-001',
    taskName: 'Test Task',
    taskCategory: 'Critical Thinking',
    taskDescription: 'Test description'
  };

  test('TC-TB01: buildTask includes taskCheck when provided', () => {
    const csvRow = {
      ...baseCsvRow,
      taskCheck: 'Write a short reflection on your experience'
    };

    const result = buildTask(csvRow, baseRewards);

    expect(result.taskCheck).toBe('Write a short reflection on your experience');
    expect(result.taskId).toBe('test-001');
    expect(result.title).toBe('Test Task');
  });

  test('TC-TB02: buildTask sets taskCheck to null when empty string', () => {
    const csvRow = {
      ...baseCsvRow,
      taskCheck: ''
    };

    const result = buildTask(csvRow, baseRewards);

    expect(result.taskCheck).toBeNull();
  });

  test('TC-TB03: buildTask sets taskCheck to null when whitespace-only', () => {
    const csvRow = {
      ...baseCsvRow,
      taskCheck: '   '
    };

    const result = buildTask(csvRow, baseRewards);

    expect(result.taskCheck).toBeNull();
  });

  test('TC-TB04: buildTask sets taskCheck to null when undefined', () => {
    const csvRow = {
      ...baseCsvRow
      // taskCheck is undefined
    };

    const result = buildTask(csvRow, baseRewards);

    expect(result.taskCheck).toBeNull();
  });

  test('TC-TB05: buildTask trims whitespace from taskCheck', () => {
    const csvRow = {
      ...baseCsvRow,
      taskCheck: '  Upload a sketch of your design  '
    };

    const result = buildTask(csvRow, baseRewards);

    expect(result.taskCheck).toBe('Upload a sketch of your design');
  });

  test('TC-TB06: buildTask preserves multi-line taskCheck text', () => {
    const multiLineCheck = `Step 1: Complete the exercise
Step 2: Take a photo
Step 3: Write a reflection`;

    const csvRow = {
      ...baseCsvRow,
      taskCheck: multiLineCheck
    };

    const result = buildTask(csvRow, baseRewards);

    expect(result.taskCheck).toBe(multiLineCheck);
  });

  test('TC-TB07: buildTask includes all required fields with taskCheck', () => {
    const csvRow = {
      ...baseCsvRow,
      taskCheck: 'Verification instructions'
    };

    const result = buildTask(csvRow, baseRewards, 'Real reward');

    expect(result).toHaveProperty('taskId');
    expect(result).toHaveProperty('title');
    expect(result).toHaveProperty('description');
    expect(result).toHaveProperty('category');
    expect(result).toHaveProperty('xpReward');
    expect(result).toHaveProperty('currencyReward');
    expect(result).toHaveProperty('cooldown');
    expect(result).toHaveProperty('requiresVerification');
    expect(result).toHaveProperty('isActive');
    expect(result).toHaveProperty('realReward');
    expect(result).toHaveProperty('taskCheck');
    expect(result.taskCheck).toBe('Verification instructions');
  });

  test('TC-TB08: buildTask handles null taskCheck', () => {
    const csvRow = {
      ...baseCsvRow,
      taskCheck: null
    };

    const result = buildTask(csvRow, baseRewards);

    expect(result.taskCheck).toBeNull();
  });
});
