const { ROLE_PERMISSIONS } = require('../config/roles');
const OrgMember = require('../models/orgMember.model');

// 1. authorize(...roles) — Platform-level role check
exports.authorize = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ 
            success: false, 
            message: `Role '${req.user.role}' is not authorized for this action` 
        });
    }
    next();
};

// 2. hasPermission(permission) — Checks user's role against ROLE_PERMISSIONS map
exports.hasPermission = (permission) => (req, res, next) => {
    const userPerms = ROLE_PERMISSIONS[req.user.role] || [];
    if (!userPerms.includes(permission)) {
        return res.status(403).json({
            success: false,
            message: `User does not have permission to perform this action (${permission})`
        });
    }
    next();
};

// 3. requireOrgRole(...orgRoles) — Org-scoped role check
//    Loads the user's OrgMember document and checks their orgRole.
//    Requires resolveOrg middleware to be called first.
exports.requireOrgRole = (...orgRoles) => async (req, res, next) => {
    try {
        if (!req.org) {
            return res.status(500).json({ success: false, message: 'Organization context not found' });
        }

        const membership = await OrgMember.findOne({ orgId: req.org._id, userId: req.user._id });
        if (!membership || !orgRoles.includes(membership.orgRole)) {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have the required role in this organization' 
            });
        }
        if (membership.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Your membership in this organization is suspended'
            });
        }
        
        req.membership = membership;
        next();
    } catch (err) {
        next(err);
    }
};

// 4. requireFeature(feature) — Checks if user's membership allows a specific feature
//    Requires resolveOrg middleware to be called first.
exports.requireFeature = (feature) => async (req, res, next) => {
    try {
        if (!req.org) {
            return res.status(500).json({ success: false, message: 'Organization context not found' });
        }

        const membership = await OrgMember.findOne({ orgId: req.org._id, userId: req.user._id });
        if (!membership || !membership.allowedFeatures.includes(feature)) {
            return res.status(403).json({ 
                success: false, 
                message: `You do not have access to this feature (${feature}) in this organization` 
            });
        }
        if (membership.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Your membership in this organization is suspended'
            });
        }
        
        req.membership = membership;
        next();
    } catch (err) {
        next(err);
    }
};
