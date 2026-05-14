/**
 * UNIT TESTS — 25 tests covering core services
 * Run: npx jest tests/unit.test.js
 */

// Mock mongoose before requiring modules
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return { ...actual, connect: jest.fn(), connection: { close: jest.fn() } };
});

describe('Task Generator', () => {
  const tg = require('../src/services/taskGenerator');

  test('TC-U01: generateRandomBatch returns correct count', () => {
    const tasks = tg.generateRandomBatch(10);
    expect(tasks.length).toBe(10);
  });

  test('TC-U02: generated tasks have required fields', () => {
    const tasks = tg.generateRandomBatch(1);
    const t = tasks[0];
    expect(t).toHaveProperty('taskId');
    expect(t).toHaveProperty('title');
    expect(t).toHaveProperty('description');
    expect(t).toHaveProperty('category');
    expect(t).toHaveProperty('xpReward');
    expect(t).toHaveProperty('currencyReward');
    expect(t).toHaveProperty('tier');
  });

  test('TC-U03: tasks have valid XP range', () => {
    const tasks = tg.generateRandomBatch(50);
    tasks.forEach(t => {
      expect(t.xpReward).toBeGreaterThanOrEqual(10);
      expect(t.xpReward).toBeLessThanOrEqual(1500);
    });
  });

  test('TC-U04: tasks have valid currency range', () => {
    const tasks = tg.generateRandomBatch(50);
    tasks.forEach(t => {
      expect(t.currencyReward).toBeGreaterThanOrEqual(5);
      expect(t.currencyReward).toBeLessThanOrEqual(750);
    });
  });

  test('TC-U05: generateByDomain returns correct domain', () => {
    const tasks = tg.generateByDomain('Critical Thinking', 5);
    tasks.forEach(t => expect(t.category).toBe('Critical Thinking'));
  });

  test('TC-U06: getDomainInfo returns all 10 domains', () => {
    const info = tg.getDomainInfo();
    expect(info.length).toBe(10);
    info.forEach(d => {
      expect(d).toHaveProperty('name');
      expect(d).toHaveProperty('icon');
      expect(d).toHaveProperty('totalPossible');
      expect(d.totalPossible).toBeGreaterThan(0);
    });
  });

  test('TC-U07: getTotalTaskCount returns 30000', () => {
    expect(tg.getTotalTaskCount()).toBe(30000);
  });

  test('TC-U08: no duplicate taskIds in batch', () => {
    const tasks = tg.generateRandomBatch(50);
    const ids = tasks.map(t => t.taskId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('TC-U09: tier names are valid', () => {
    const valid = ['Micro', 'Small', 'Medium', 'Large', 'Mega'];
    const tasks = tg.generateRandomBatch(100);
    tasks.forEach(t => expect(valid).toContain(t.tier));
  });

  test('TC-U10: Mega tasks have higher rewards than Micro', () => {
    const tasks = tg.generateRandomBatch(200);
    const micro = tasks.filter(t => t.tier === 'Micro');
    const mega = tasks.filter(t => t.tier === 'Mega');
    if (micro.length && mega.length) {
      const avgMicro = micro.reduce((s, t) => s + t.xpReward, 0) / micro.length;
      const avgMega = mega.reduce((s, t) => s + t.xpReward, 0) / mega.length;
      expect(avgMega).toBeGreaterThan(avgMicro);
    }
  });
});

describe('AI Verifier', () => {
  const { verifyTaskCompletion } = require('../src/services/aiVerifier');

  test('TC-U11: rejects empty proof', () => {
    const r = verifyTaskCompletion({ title: 'Test', category: 'Critical Thinking' }, '', {});
    expect(r.verified).toBe(false);
    expect(r.score).toBe(0);
  });

  test('TC-U12: rejects short proof', () => {
    const r = verifyTaskCompletion({ title: 'Test', category: 'Critical Thinking' }, 'did it', {});
    expect(r.verified).toBe(false);
  });

  test('TC-U13: accepts detailed proof with keywords', () => {
    const r = verifyTaskCompletion(
      { title: 'Analyze media narrative', category: 'Critical Thinking' },
      'I analyzed a mainstream media narrative about climate policy. I identified three logical fallacies including appeal to authority and straw man arguments. I compared the data from the original source with the media interpretation and found significant bias in the framing.',
      {}
    );
    expect(r.verified).toBe(true);
    expect(r.score).toBeGreaterThanOrEqual(30);
  });

  test('TC-U14: photo evidence increases score', () => {
    const without = verifyTaskCompletion({ title: 'Test', category: 'Physical Mastery' }, 'I exercised for 30 minutes today doing pushups and running', {});
    const withPhoto = verifyTaskCompletion({ title: 'Test', category: 'Physical Mastery' }, 'I exercised for 30 minutes today doing pushups and running', { hasPhoto: true });
    expect(withPhoto.score).toBeGreaterThan(without.score);
  });

  test('TC-U15: GPS evidence increases score', () => {
    const without = verifyTaskCompletion({ title: 'Test', category: 'Physical Mastery' }, 'I ran 5km in the park this morning at 7am', {});
    const withGPS = verifyTaskCompletion({ title: 'Test', category: 'Physical Mastery' }, 'I ran 5km in the park this morning at 7am', { hasGPS: true });
    expect(withGPS.score).toBeGreaterThan(without.score);
  });

  test('TC-U16: multiplier is between 1.0 and 1.5 for verified', () => {
    const r = verifyTaskCompletion(
      { title: 'Study economics', category: 'Sound Money' },
      'I studied the history of inflation and how central banks create money. I calculated compound interest on my savings account and tracked my budget for the week.',
      {}
    );
    if (r.verified) {
      expect(r.multiplier).toBeGreaterThanOrEqual(1.0);
      expect(r.multiplier).toBeLessThanOrEqual(1.5);
    }
  });
});

describe('XP Service', () => {
  const xp = require('../src/services/xpService');

  test('TC-U17: xpRequiredForLevel increases with level', () => {
    expect(xp.xpRequiredForLevel(5)).toBeGreaterThan(xp.xpRequiredForLevel(1));
    expect(xp.xpRequiredForLevel(10)).toBeGreaterThan(xp.xpRequiredForLevel(5));
  });

  test('TC-U18: calculateRank returns correct level', () => {
    expect(xp.calculateRank(0)).toBe(1);
    expect(xp.calculateRank(100)).toBe(2);
    expect(xp.calculateRank(10000)).toBeGreaterThan(5);
  });

  test('TC-U19: getRankName returns string', () => {
    const name = xp.getRankName(1);
    expect(typeof name).toBe('string');
    expect(name.length).toBeGreaterThan(0);
  });

  test('TC-U20: xpToNextRank is positive', () => {
    expect(xp.xpToNextRank(50)).toBeGreaterThan(0);
  });
});

describe('Job System', () => {
  const js = require('../src/services/jobSystem');

  test('TC-U21: getJobCount returns 1200', () => {
    expect(js.getJobCount()).toBe(1200);
  });

  test('TC-U22: getJobFamilies returns 20 families', () => {
    expect(js.getJobFamilies().length).toBe(20);
  });

  test('TC-U23: getJob returns valid job', () => {
    const job = js.getJob('developer', 2, 0);
    expect(job).toHaveProperty('jobId');
    expect(job).toHaveProperty('name');
    expect(job).toHaveProperty('abilities');
    expect(job.abilities.length).toBeGreaterThan(0);
  });

  test('TC-U24: job stats scale with tier', () => {
    const t0 = js.getJob('warrior', 0, 0);
    const t5 = js.getJob('warrior', 5, 0);
    expect(t5.stats.hp).toBeGreaterThan(t0.stats.hp);
    expect(t5.stats.atk).toBeGreaterThan(t0.stats.atk);
  });

  test('TC-U25: hybrid jobs work', () => {
    const h = js.getHybridJobs('developer', 'scientist');
    expect(h).toHaveProperty('hybridId');
    expect(h).toHaveProperty('name');
    expect(h.name).toContain('Developer');
    expect(h.name).toContain('Scientist');
  });
});

describe('Engagement Engine', () => {
  const eng = require('../src/services/engagementEngine');

  test('TC-U26: combo multiplier for recent activity', () => {
    const r = eng.getComboMultiplier(new Date(Date.now() - 30000)); // 30s ago
    expect(r.multiplier).toBeGreaterThan(1);
  });

  test('TC-U27: no combo for old activity', () => {
    const r = eng.getComboMultiplier(new Date(Date.now() - 3600000)); // 1hr ago
    expect(r.multiplier).toBe(1);
  });

  test('TC-U28: streak multiplier scales', () => {
    expect(eng.getStreakMultiplier(1).multiplier).toBe(1);
    expect(eng.getStreakMultiplier(7).multiplier).toBe(1.25);
    expect(eng.getStreakMultiplier(30).multiplier).toBe(1.5);
    expect(eng.getStreakMultiplier(100).multiplier).toBe(2.0);
  });
});
