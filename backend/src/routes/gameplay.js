const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const gc = require('../controllers/gameplayController');

router.get('/status', authenticate, gc.getGameStatus);
router.post('/spend-energy', authenticate, gc.spendEnergy);
router.post('/upgrade-hub', authenticate, gc.upgradeHub);
router.post('/train-skill/:skill', authenticate, gc.trainSkill);
router.get('/generators', authenticate, gc.getGenerators);
router.post('/generators/:id/buy', authenticate, gc.buyGenerator);
router.post('/generators/:id/automate', authenticate, gc.automateGenerator);
router.post('/collect-income', authenticate, gc.collectIncome);
router.get('/quests', authenticate, gc.getQuests);
router.post('/quests/:questId/complete', authenticate, gc.completeQuest);

module.exports = router;
