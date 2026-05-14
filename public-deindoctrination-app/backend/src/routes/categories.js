const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// Public route - get active categories
router.get('/', categoryController.getActiveCategories);

module.exports = router;
