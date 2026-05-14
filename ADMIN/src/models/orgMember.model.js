const mongoose = require('mongoose');
const { ORG_ROLES, FEATURES } = require('../config/roles');

const orgMemberSchema = new mongoose.Schema({
    orgId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    orgRole: {
        type: String,
        enum: Object.values(ORG_ROLES),
        default: ORG_ROLES.VIEWER,
        required: true
    },
    allowedFeatures: {
        type: [String],
        enum: Object.values(FEATURES),
        default: []
    },
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'suspended'],
        default: 'active'
    },
    joinedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Compound unique index to ensure a user is only a member of an org once
orgMemberSchema.index({ orgId: 1, userId: 1 }, { unique: true });

const OrgMember = mongoose.model('OrgMember', orgMemberSchema);
module.exports = OrgMember;
