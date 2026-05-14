const express = require('express');
const router = express.Router();

const {
    getMembers,
    addMember,
    updateMember,
    removeMember,
    suspendMember
} = require('../controller/teamMember.controller');

const { protect } = require('../middleware/auth.middleware');
const { resolveOrg } = require('../middleware/org.middleware');
const { requireOrgRole } = require('../middleware/role.middleware');
const { ORG_ROLES } = require('../config/roles');
const { validateAddMember, validateUpdateMember } = require('../middleware/team.validation');

// All team routes require the user to be authenticated, have an org, and be the owner
router.use(protect);
router.use(resolveOrg);
router.use(requireOrgRole(ORG_ROLES.OWNER));

router.route('/')
    .get(getMembers)
    .post(validateAddMember, addMember);

router.route('/:memberId')
    .put(validateUpdateMember, updateMember)
    .delete(removeMember);

router.route('/:memberId/suspend')
    .patch(suspendMember);

module.exports = router;
