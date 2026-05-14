const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getAllCivilizations, createCivilization, joinCivilization, leaveCivilization, getMyCivilization } = require('../controllers/civilizationController');

router.get('/', auth.authenticate, getAllCivilizations);
router.get('/mine', auth.authenticate, getMyCivilization);
router.post('/', auth.authenticate, createCivilization);
router.post('/join/:civId', auth.authenticate, joinCivilization);
router.post('/leave', auth.authenticate, leaveCivilization);

module.exports = router;
