const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getAllJobs, getJobFamilies, getJob, getJobCount, getJobsByFamily, getHybridJobs } = require('../services/jobSystem');
const User = require('../models/User');

router.get('/families', authenticate, (req, res) => { res.json(getJobFamilies()); });
router.get('/count', authenticate, (req, res) => { res.json({ total: getJobCount(), families: getJobFamilies().length }); });
router.get('/family/:familyId', authenticate, (req, res) => { res.json(getJobsByFamily(req.params.familyId)); });
router.get('/hybrid/:f1/:f2', authenticate, (req, res) => {
  const h = getHybridJobs(req.params.f1, req.params.f2);
  if (!h) return res.status(404).json({ error: 'Invalid families' });
  res.json(h);
});
router.get('/:familyId/:tier/:spec', authenticate, (req, res) => {
  const job = getJob(req.params.familyId, parseInt(req.params.tier), parseInt(req.params.spec));
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

router.post('/unlock/:familyId/:tier/:spec', authenticate, async (req, res) => {
  try {
    const job = getJob(req.params.familyId, parseInt(req.params.tier), parseInt(req.params.spec || 0));
    if (!job) return res.status(404).json({ error: 'Job not found' });
    const user = await User.findById(req.userId);
    if (user.currency < job.unlockCost) return res.status(400).json({ error: 'Need ' + job.unlockCost + ' credits' });
    user.currency -= job.unlockCost;
    await user.save();
    res.json({ message: 'Unlocked ' + job.name + '!', job: job });
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

module.exports = router;
