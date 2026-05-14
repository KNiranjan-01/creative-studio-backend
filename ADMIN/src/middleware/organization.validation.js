const { body } = require('express-validator');

const industryCategories = [
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
];

const brandTones = [
    'Playful & Fun', 'Professional & Authoritative', 'Bold & Disruptive',
    'Inspirational & Motivational', 'Witty & Humorous', 'Minimalist & Clean',
    'Luxurious & Premium', 'Empathetic & Caring'
];

const primaryBusinessGoals = [
    'Brand Awareness', 'Lead Generation', 'Sales & Conversions',
    'Customer Retention & Loyalty', 'Community Building', 'Product Launch & Promotion'
];

const preferredPlatformsOptions = ['Instagram', 'Twitter', 'LinkedIn', 'Facebook'];
const postingFrequencyOptions = ['Light', 'Standard', 'Aggressive'];

const validateCreate = [
    body('companyName').trim().notEmpty().withMessage('Company name is required').isLength({ max: 100 }),
    body('industryCategory').isIn(industryCategories).withMessage('Invalid industry category'),
    body('companyDescription').notEmpty().withMessage('Company description is required').isLength({ max: 1000 }),
    body('brandTone').isIn(brandTones).withMessage('Invalid brand tone'),
    body('targetAudience').notEmpty().withMessage('Target audience is required').isLength({ max: 300 }),
    body('primaryBusinessGoal').isIn(primaryBusinessGoals).withMessage('Invalid primary business goal'),
    body('preferredPlatforms').isArray({ min: 1 }).withMessage('At least one preferred platform is required')
        .custom((value) => {
            if (!value.every(platform => preferredPlatformsOptions.includes(platform))) {
                throw new Error('Invalid preferred platform');
            }
            return true;
        }),
    body('country').notEmpty().withMessage('Country is required'),
    body('websiteUrl').isURL().withMessage('Must be a valid URL'),
    body('logoBase64').notEmpty().withMessage('Logo is required'),
    body('brandColors').isArray({ min: 3, max: 3 }).withMessage('Exactly 3 brand colors are required')
        .custom((value) => {
            if (!value.every(color => /^#[0-9A-Fa-f]{6}$/.test(color))) {
                throw new Error('Brand colors must be valid hex codes');
            }
            return true;
        }),
    body('postingFrequency').isIn(postingFrequencyOptions).withMessage('Invalid posting frequency')
];

const validateUpdate = [
    body('companyName').optional().trim().notEmpty().isLength({ max: 100 }),
    body('industryCategory').optional().isIn(industryCategories),
    body('companyDescription').optional().notEmpty().isLength({ max: 1000 }),
    body('brandTone').optional().isIn(brandTones),
    body('targetAudience').optional().notEmpty().isLength({ max: 300 }),
    body('primaryBusinessGoal').optional().isIn(primaryBusinessGoals),
    body('preferredPlatforms').optional().isArray({ min: 1 })
        .custom((value) => {
            if (value && !value.every(platform => preferredPlatformsOptions.includes(platform))) {
                throw new Error('Invalid preferred platform');
            }
            return true;
        }),
    body('country').optional().notEmpty(),
    body('websiteUrl').optional().isURL(),
    body('logoBase64').optional().notEmpty(),
    body('brandColors').optional().isArray({ min: 3, max: 3 })
        .custom((value) => {
            if (value && !value.every(color => /^#[0-9A-Fa-f]{6}$/.test(color))) {
                throw new Error('Brand colors must be valid hex codes');
            }
            return true;
        }),
    body('postingFrequency').optional().isIn(postingFrequencyOptions)
];

module.exports = {
    validateCreate,
    validateUpdate
};
