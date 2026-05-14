const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
    ownerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true, 
        index: true 
    },
    companyName: { 
        type: String, 
        required: true, 
        trim: true, 
        maxlength: 100 
    },
    industryCategory: { 
        type: String, 
        required: true, 
        enum: [
            'Technology & SaaS', 'Healthcare & Medical', 'E-commerce & Retail',
            'Finance & Banking', 'Real Estate', 'Education & E-learning',
            'Food & Beverage', 'Hospitality & Travel', 'Fitness & Wellness',
            'Fashion & Apparel', 'Non-Profit & NGO', 'Legal Services',
            'Manufacturing', 'Entertainment & Media', 'Automotive',
            'Agriculture & Farming', 'Construction & Architecture', 'Event Management',
            'Consulting & Professional Services', 'Insurance',
            'Logistics & Supply Chain', 'Telecommunications', 'Energy & Utilities',
            'Pharmaceuticals', 'Media & Publishing', 'Gaming & Esports',
            'Beauty & Cosmetics', 'Recruitment & HR', 'Home Services & Interior Design',
            'Sports & Recreation'
        ] 
    },
    companyDescription: { 
        type: String, 
        required: true, 
        maxlength: 1000 
    },
    brandTone: { 
        type: String, 
        required: true, 
        enum: [
            'Playful & Fun', 'Professional & Authoritative', 'Bold & Disruptive',
            'Inspirational & Motivational', 'Witty & Humorous', 'Minimalist & Clean',
            'Luxurious & Premium', 'Empathetic & Caring'
        ] 
    },
    targetAudience: { 
        type: String, 
        required: true, 
        maxlength: 300 
    },
    primaryBusinessGoal: { 
        type: String, 
        required: true, 
        enum: [
            'Brand Awareness', 'Lead Generation', 'Sales & Conversions',
            'Customer Retention & Loyalty', 'Community Building', 'Product Launch & Promotion'
        ] 
    },
    preferredPlatforms: { 
        type: [String], 
        validate: [v => v.length >= 1, 'At least one preferred platform is required'],
        enum: ['Instagram', 'Twitter', 'LinkedIn', 'Facebook']
    },
    country: { 
        type: String, 
        required: true 
    },
    websiteUrl: { 
        type: String, 
        required: true 
    },
    logoUrl: { 
        type: String, 
        required: true 
    },
    brandColors: { 
        type: [String], 
        validate: [v => v.length === 3, 'Exactly 3 brand colors are required'] 
    },
    postingFrequency: { 
        type: String, 
        enum: ['Light', 'Standard', 'Aggressive'], 
        required: true 
    },
    isDeleted: { 
        type: Boolean, 
        default: false, 
        index: true 
    },
    deletedAt: { 
        type: Date, 
        default: null 
    }
}, { timestamps: true });

// Sparse unique index to allow only one active org per user
organizationSchema.index({ ownerId: 1, isDeleted: 1 }, { unique: true, sparse: true });

// Default query filter — exclude soft-deleted docs for all normal queries
organizationSchema.pre(/^find/, function() {
    if (!this.getOptions().includeDeleted) {
        this.where({ isDeleted: false });
    }
});

const Organization = mongoose.model('Organization', organizationSchema);
module.exports = Organization;
