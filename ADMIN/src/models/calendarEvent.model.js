const mongoose = require('mongoose');

const calendarEventSchema = new mongoose.Schema({
    orgId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: [true, 'Organization ID is required']
    },
    date: {
        type: String, // YYYY-MM-DD format
        required: [true, 'Date is required'],
        match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format']
    },
    time: {
        type: String, // HH:mm format
        match: [/^([01]\d|2[0-3]):?([0-5]\d)$/, 'Time must be in HH:mm format'],
        default: null
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true
    },
    notes: {
        type: String,
        default: ''
    },
    platforms: {
        type: [String],
        default: []
    },
    mediaFilenames: {
        type: [String],
        default: []
    },
    status: {
        type: String,
        enum: ['Idea', 'In Progress', 'Scheduled', 'Posted'],
        default: 'Idea'
    },
    source: {
        type: String,
        enum: ['Manual', 'AI_Generated', 'Holiday'],
        default: 'Manual'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Compound index for optimized month-view queries per organization
calendarEventSchema.index({ orgId: 1, date: 1 });

module.exports = mongoose.model('CalendarEvent', calendarEventSchema);
