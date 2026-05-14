const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getResearchTree, getDomainsSummary, startResearch, completeResearch } = require('../controllers/researchController');

router.get('/tree', auth.authenticate, getResearchTree);
router.get('/domains', auth.authenticate, getDomainsSummary);
router.post('/start/:nodeId', auth.authenticate, startResearch);
router.post('/complete/:nodeId', auth.authenticate, completeResearch);

module.exports = router;
