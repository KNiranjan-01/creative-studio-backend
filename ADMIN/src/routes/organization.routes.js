const express = require('express');
const router = express.Router();

const {
    createOrganization,
    getOrganization,
    updateOrganization,
    deleteOrganization
} = require('../controller/organization.controller');

const { protect } = require('../middleware/auth.middleware');
const { validateCreate, validateUpdate } = require('../middleware/organization.validation');

router.post('/', protect, validateCreate, createOrganization);
router.get('/', protect, getOrganization);
router.put('/', protect, validateUpdate, updateOrganization);
router.delete('/', protect, deleteOrganization);

module.exports = router;
