const express = require('express');
const router = express.Router();

const {
    saveCreative,
    getCreatives,
    deleteCreative,
    toggleFavorite
} = require('../controller/creative.controller');

const { protect } = require('../middleware/auth.middleware');
const { resolveOrg } = require('../middleware/org.middleware');

router.post('/', protect, resolveOrg, saveCreative);
router.get('/', protect, resolveOrg, getCreatives);
router.delete('/:id', protect, resolveOrg, deleteCreative);
router.patch('/:id/favorite', protect, resolveOrg, toggleFavorite);

module.exports = router;
