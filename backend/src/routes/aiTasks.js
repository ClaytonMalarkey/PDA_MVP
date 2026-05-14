const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const aiTaskController = require('../controllers/aiTaskController');

/**
 * AI Task Routes
 * Handles AI-assisted task completion
 */

// Get AI assistance for a specific task
router.get('/tasks/:taskId/assist', authenticateToken, aiTaskController.getTaskAssistance);

// Submit AI-assisted task completion
router.post('/tasks/:taskId/submit', authenticateToken, aiTaskController.submitAIAssistedTask);

module.exports = router;
