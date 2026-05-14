const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validateLogin, validateRegister } = require('../middleware/validate');

router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/reset-password', authController.requestPasswordReset);
router.post('/reset-password-confirm', authController.resetPassword);
router.get('/verify', authenticate, authController.verify);

module.exports = router;
