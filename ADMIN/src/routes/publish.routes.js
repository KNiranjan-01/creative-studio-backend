const express = require('express');
const router = express.Router();

const { publish } = require('../controller/publish.controller');
const { protect } = require('../middleware/auth.middleware');

// POST /api/publish — Publish to social platforms (authenticated)
router.post('/', protect, publish);

module.exports = router;
