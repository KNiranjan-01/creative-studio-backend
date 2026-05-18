const Organization = require('../models/organization.model');
const OrgMember = require('../models/orgMember.model');
const { ORG_ROLES, FEATURES } = require('../config/roles');
const asyncHandler = require('../utils/asyncHandler');
const { validationResult } = require('express-validator');
const { v2: cloudinary } = require('cloudinary');

cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });

async function uploadLogoToCloudinary(base64String, orgId) {
    const folderPath = orgId ? `creative-studio/${orgId}/logos` : 'creative-studio/logos';
    const result = await cloudinary.uploader.upload(base64String, {
        folder: folderPath,
        resource_type: 'image',
        transformation: [{ width: 400, height: 400, crop: 'limit' }]
    });
    return result.secure_url;
}

exports.createOrganization = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, errors: errors.array() });
    }

    const existingOrg = await Organization.findOne({ ownerId: req.user._id });
    if (existingOrg) {
        return res.status(409).json({ success: false, message: 'Organization already exists for this user' });
    }

    const newOrg = new Organization({
        ...orgData,
        ownerId: req.user._id
    });

    if (logoBase64) {
        newOrg.logoUrl = await uploadLogoToCloudinary(logoBase64, newOrg._id);
    }

    await newOrg.save();

    // Create the OrgMember for the owner
    await OrgMember.create({
        orgId: newOrg._id,
        userId: req.user._id,
        orgRole: ORG_ROLES.OWNER,
        allowedFeatures: Object.values(FEATURES),
        invitedBy: req.user._id
    });

    res.status(201).json({ success: true, data: newOrg });
});

exports.getOrganization = asyncHandler(async (req, res) => {
    // 1. Try to find an existing membership
    let membership = await OrgMember.findOne({ userId: req.user._id }).populate('orgId');

    if (membership && membership.orgId) {
        return res.status(200).json({ 
            success: true, 
            data: membership.orgId,
            membership: membership
        });
    }

    // 2. Self-healing for legacy accounts: check if they own an org but lack a membership record
    const org = await Organization.findOne({ ownerId: req.user._id });
    
    if (org) {
        // Create the missing membership record
        membership = await OrgMember.create({
            orgId: org._id,
            userId: req.user._id,
            orgRole: ORG_ROLES.OWNER,
            allowedFeatures: Object.values(FEATURES),
            invitedBy: req.user._id
        });

        return res.status(200).json({
            success: true,
            data: org,
            membership: membership
        });
    }

    // 3. Setup is not complete
    return res.status(404).json({ success: true, setupComplete: false });
});

exports.updateOrganization = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, errors: errors.array() });
    }

    const { logoBase64, ...updateData } = req.body;

    let org = await Organization.findOne({ ownerId: req.user._id });
    if (!org) {
        return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    if (logoBase64) {
        updateData.logoUrl = await uploadLogoToCloudinary(logoBase64, org._id);
    }

    org = await Organization.findByIdAndUpdate(
        org._id,
        updateData,
        { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: org });
});

exports.deleteOrganization = asyncHandler(async (req, res) => {
    const org = await Organization.findOneAndUpdate(
        { ownerId: req.user._id },
        { isDeleted: true, deletedAt: new Date() },
        { new: true }
    );

    if (!org) {
        return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    res.status(200).json({ success: true, message: 'Organization soft deleted successfully' });
});
