const OrgMember = require('../models/orgMember.model');
const User = require('../models/user.model');
const asyncHandler = require('../utils/asyncHandler');
const { ORG_ROLES, ORG_ROLE_DEFAULT_FEATURES } = require('../config/roles');
const { validationResult } = require('express-validator');

exports.getMembers = asyncHandler(async (req, res) => {
    const members = await OrgMember.find({ orgId: req.org._id })
        .populate('userId', 'fullName email')
        .populate('invitedBy', 'fullName');

    res.status(200).json({ success: true, data: members });
});

exports.addMember = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, errors: errors.array() });
    }

    const { email, orgRole, allowedFeatures } = req.body;

    // For V1, we only add existing users. 
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found in the system. They must register first.' });
    }

    if (user._id.toString() === req.user._id.toString()) {
        return res.status(400).json({ success: false, message: 'You cannot invite yourself' });
    }

    const existingMembership = await OrgMember.findOne({ orgId: req.org._id, userId: user._id });
    if (existingMembership) {
        return res.status(400).json({ success: false, message: 'User is already a member of this organization' });
    }

    // Default features if not explicitly provided
    const features = allowedFeatures && allowedFeatures.length > 0 
        ? allowedFeatures 
        : ORG_ROLE_DEFAULT_FEATURES[orgRole] || [];

    const newMember = await OrgMember.create({
        orgId: req.org._id,
        userId: user._id,
        orgRole,
        allowedFeatures: features,
        invitedBy: req.user._id
    });

    await newMember.populate('userId', 'fullName email');
    await newMember.populate('invitedBy', 'fullName');

    res.status(201).json({ success: true, message: 'Member added successfully', data: newMember });
});

exports.updateMember = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, errors: errors.array() });
    }

    const { orgRole, allowedFeatures } = req.body;
    const { memberId } = req.params;

    const member = await OrgMember.findOne({ _id: memberId, orgId: req.org._id });
    if (!member) {
        return res.status(404).json({ success: false, message: 'Member not found in this organization' });
    }

    if (member.orgRole === ORG_ROLES.OWNER) {
        return res.status(403).json({ success: false, message: 'Cannot update the owner role' });
    }

    if (orgRole) member.orgRole = orgRole;
    if (allowedFeatures) member.allowedFeatures = allowedFeatures;

    await member.save();
    
    await member.populate('userId', 'fullName email');
    await member.populate('invitedBy', 'fullName');

    res.status(200).json({ success: true, message: 'Member updated successfully', data: member });
});

exports.removeMember = asyncHandler(async (req, res) => {
    const { memberId } = req.params;

    const member = await OrgMember.findOne({ _id: memberId, orgId: req.org._id });
    if (!member) {
        return res.status(404).json({ success: false, message: 'Member not found in this organization' });
    }

    if (member.orgRole === ORG_ROLES.OWNER) {
        return res.status(403).json({ success: false, message: 'Cannot remove the owner from the organization' });
    }

    await member.deleteOne();

    res.status(200).json({ success: true, message: 'Member removed successfully' });
});

exports.suspendMember = asyncHandler(async (req, res) => {
    const { memberId } = req.params;

    const member = await OrgMember.findOne({ _id: memberId, orgId: req.org._id });
    if (!member) {
        return res.status(404).json({ success: false, message: 'Member not found in this organization' });
    }

    if (member.orgRole === ORG_ROLES.OWNER) {
        return res.status(403).json({ success: false, message: 'Cannot suspend the owner' });
    }

    member.status = member.status === 'active' ? 'suspended' : 'active';
    await member.save();

    await member.populate('userId', 'fullName email');
    await member.populate('invitedBy', 'fullName');

    res.status(200).json({ 
        success: true, 
        message: `Member ${member.status === 'active' ? 'activated' : 'suspended'} successfully`, 
        data: member 
    });
});
