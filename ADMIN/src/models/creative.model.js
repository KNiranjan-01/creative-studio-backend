const mongoose = require('mongoose');

const creativeSchema = new mongoose.Schema({
    orgId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: [true, 'Organization ID is required']
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    prompt: {
        type: String,
        required: [true, 'Prompt is required']
    },
    imageUrl: {
        type: String,
        required: [true, 'Image URL is required']
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Created by user is required']
    },
    type: {
        type: String,
        enum: ['image', 'text', 'banner'],
        default: 'image'
    },
    size: {
        type: String,
        default: '1080x1080'
    },
    isFavorite: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

creativeSchema.index({ orgId: 1, createdAt: -1 });

module.exports = mongoose.model('Creative', creativeSchema);
