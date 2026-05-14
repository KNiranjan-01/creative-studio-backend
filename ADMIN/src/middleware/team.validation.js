const { check } = require('express-validator');
const { ORG_ROLES, FEATURES } = require('../config/roles');

exports.validateAddMember = [
    check('email', 'Please include a valid email').isEmail(),
    check('orgRole', 'Please provide a valid org role')
        .isIn([ORG_ROLES.MANAGER, ORG_ROLES.EDITOR, ORG_ROLES.VIEWER]),
    check('allowedFeatures', 'Features must be an array').optional().isArray(),
    check('allowedFeatures.*', 'Invalid feature')
        .optional()
        .isIn(Object.values(FEATURES))
];

exports.validateUpdateMember = [
    check('orgRole', 'Please provide a valid org role')
        .optional()
        .isIn([ORG_ROLES.MANAGER, ORG_ROLES.EDITOR, ORG_ROLES.VIEWER]),
    check('allowedFeatures', 'Features must be an array').optional().isArray(),
    check('allowedFeatures.*', 'Invalid feature')
        .optional()
        .isIn(Object.values(FEATURES))
];
