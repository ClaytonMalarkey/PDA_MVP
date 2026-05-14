const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, taskController.getTasks);
router.post('/:taskId/complete', authenticate, taskController.completeTask);
router.get('/history', authenticate, taskController.getUserTasks);

module.exports = router;
