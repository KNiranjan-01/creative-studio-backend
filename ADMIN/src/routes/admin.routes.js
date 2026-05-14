const express = require('express');
const router = express.Router();

const {
    getAllOrganizations,
    getOrganizationById,
    restoreOrganization,
    forceDeleteOrganization,
    getPlatformStats
} = require('../controller/admin.controller');

const { protect } = require('../middleware/auth.middleware');
const { hasPermission } = require('../middleware/role.middleware');
const { PERMISSIONS } = require('../config/roles');

router.get('/stats', protect, hasPermission(PERMISSIONS.PLATFORM_ORG_VIEW_ALL), getPlatformStats);
router.get('/organizations', protect, hasPermission(PERMISSIONS.PLATFORM_ORG_VIEW_ALL), getAllOrganizations);
router.get('/organizations/:id', protect, hasPermission(PERMISSIONS.PLATFORM_ORG_VIEW_ALL), getOrganizationById);
router.patch('/organizations/:id/restore', protect, hasPermission(PERMISSIONS.PLATFORM_ORG_RESTORE), restoreOrganization);
router.delete('/organizations/:id', protect, hasPermission(PERMISSIONS.PLATFORM_ORG_FORCE_DELETE), forceDeleteOrganization);

module.exports = router;
