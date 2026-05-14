const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    platform: {
        type: String,
        required: true,
        enum: ['twitter', 'linkedin', 'facebook', 'instagram'],
        lowercase: true
    },
    accessToken: {
        type: String,
        required: true,
        select: false
    },
    refreshToken: {
        type: String,
        select: false
    },
    expiresAt: {
        type: Number, // Unix timestamp in ms
        default: null
    },
    profileId: {
        type: String,
        default: null
    },
    profileName: {
        type: String,
        default: null
    }
}, { timestamps: true });

// One connection per platform per user
connectionSchema.index({ userId: 1, platform: 1 }, { unique: true });

const Connection = mongoose.model('Connection', connectionSchema);
module.exports = Connection;
