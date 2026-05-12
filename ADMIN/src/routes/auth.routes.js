const express = require('express');
const router = express.Router();

const {
    register,
    login,
    refresh,
    logout,
    getMe
} = require('../controller/auth.controller');

const { protect } = require('../middleware/auth.middleware');
const { validateRegister, validateLogin } = require('../middleware/auth.validation');
const { authLimiter } = require('../middleware/rateLimiter');

// Public routes with strict rate limiting
router.post('/register', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);
router.post('/refresh', refresh); // Rate limiting is general for this, or we could apply authLimiter

// Private routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

module.exports = router;
