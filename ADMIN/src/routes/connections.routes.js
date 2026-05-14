const express = require('express');
const router = express.Router();

const {
    getStatus,
    disconnect,
    initiateOAuth,
    handleCallback
} = require('../controller/connections.controller');

const { protect } = require('../middleware/auth.middleware');

// Protected routes (require JWT)
router.get('/status', protect, getStatus);
router.post('/disconnect', protect, disconnect);
router.post('/:platform/initiate', protect, initiateOAuth);

// Public OAuth callback (browser redirect from provider — no JWT)
router.get('/:platform/callback', handleCallback);

module.exports = router;
