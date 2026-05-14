const Organization = require('../models/organization.model');
const OrgMember = require('../models/orgMember.model');
const asyncHandler = require('../utils/asyncHandler');

// Loads the organization for the current user and attaches to req.org
// It first checks if the user owns an organization.
// If not, it checks if the user is a member of any organization.
// If multiple memberships exist, it might need query params to specify which one (omitted for MVP, assumes single org).
exports.resolveOrg = asyncHandler(async (req, res, next) => {
    // 1. Check if user is an owner
    let org = await Organization.findOne({ ownerId: req.user._id });
    
    // 2. Check if user is a member of another org
    if (!org) {
        const membership = await OrgMember.findOne({ userId: req.user._id }).populate('orgId');
        if (membership && membership.orgId) {
            org = membership.orgId;
        }
    }

    if (!org) {
        return res.status(404).json({ success: false, message: 'No organization found for this user' });
    }

    req.org = org;
    next();
});
