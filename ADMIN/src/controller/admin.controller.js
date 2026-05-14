const Organization = require('../models/organization.model');
const asyncHandler = require('../utils/asyncHandler');

exports.getAllOrganizations = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const queryOptions = {};
    if (req.query.includeDeleted === 'true') {
        // Bypass the default soft-delete filter
        queryOptions.includeDeleted = true;
    }

    // find all with options
    const query = Organization.find({}, null, queryOptions).populate('ownerId', 'fullName email');

    const orgs = await query.skip(startIndex).limit(limit);
    const total = await Organization.countDocuments({}, queryOptions);

    res.status(200).json({
        success: true,
        count: orgs.length,
        pagination: {
            page,
            limit,
            total
        },
        data: orgs
    });
});

exports.getOrganizationById = asyncHandler(async (req, res) => {
    const org = await Organization.findById(req.params.id, null, { includeDeleted: true }).populate('ownerId', 'fullName email');

    if (!org) {
        return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    res.status(200).json({ success: true, data: org });
});

exports.restoreOrganization = asyncHandler(async (req, res) => {
    const org = await Organization.findByIdAndUpdate(
        req.params.id,
        { isDeleted: false, deletedAt: null },
        { new: true, runValidators: true, includeDeleted: true }
    );

    if (!org) {
        return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    res.status(200).json({ success: true, message: 'Organization restored successfully', data: org });
});

exports.forceDeleteOrganization = asyncHandler(async (req, res) => {
    const org = await Organization.findByIdAndDelete(req.params.id, { includeDeleted: true });

    if (!org) {
        return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    res.status(200).json({ success: true, message: 'Organization permanently deleted' });
});
