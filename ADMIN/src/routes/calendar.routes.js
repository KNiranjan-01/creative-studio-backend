const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth.middleware');
const { resolveOrg } = require('../middleware/org.middleware');
const { requireOrgRole } = require('../middleware/role.middleware');
const {
    generateCalendar,
    confirmCalendar,
    getEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    bulkDelete,
    getHolidays
} = require('../controller/calendar.controller');

// Apply auth and context to all calendar routes
router.use(protect);
router.use(resolveOrg);

// Readers can get events
router.get('/', getEvents);
router.get('/holidays', getHolidays);

// Owners, managers, and editors can modify events
const modifyRoles = ['owner', 'manager', 'editor'];

router.post('/generate', requireOrgRole(...modifyRoles), generateCalendar);
router.post('/confirm', requireOrgRole(...modifyRoles), confirmCalendar);
router.post('/', requireOrgRole(...modifyRoles), createEvent);
router.delete('/bulk', requireOrgRole(...modifyRoles), bulkDelete);
router.route('/:id')
    .put(requireOrgRole(...modifyRoles), updateEvent)
    .delete(requireOrgRole(...modifyRoles), deleteEvent);

module.exports = router;
