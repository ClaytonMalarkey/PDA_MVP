const express = require('express');
const router = express.Router();
const empireController = require('../controllers/empireController');
const { authenticate } = require('../middleware/auth');

router.get('/structures', authenticate, empireController.getStructures);
router.get('/user-structures', authenticate, empireController.getUserStructures);
router.post('/structures/:structureId/purchase', authenticate, empireController.purchaseStructure);
router.post('/structures/:structureId/upgrade', authenticate, empireController.upgradeStructure);
router.post('/collect-idle', authenticate, empireController.collectIdleIncome);

module.exports = router;
