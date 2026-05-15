const holidayService = require('../service/holiday.service');

// Industry Templates (Expandable)
const industryTemplates = {
    'Technology & SaaS': ['Product Demo', 'Tech Tip', 'Customer Success Story', 'Industry News'],
    'E-commerce & Retail': ['Product Feature', 'Behind the Scenes', 'User Generated Content', 'Flash Sale Announcement'],
    'Healthcare & Wellness': ['Health Tip', 'Patient Testimonial', 'Myth Busting', 'Service Spotlight'],
    'Real Estate': ['Property Tour', 'Market Update', 'Neighborhood Guide', 'Client Review'],
    'Education & E-learning': ['Study Tip', 'Course Highlight', 'Alumni Success', 'Instructor Q&A'],
    'Food & Beverage': ['Recipe Share', 'Menu Highlight', 'Behind the Kitchen', 'Customer Feature'],
    'Travel & Hospitality': ['Destination Guide', 'Travel Tip', 'Room Tour', 'Local Event Spotlight'],
    'Finance & Accounting': ['Financial Tip', 'Market Analysis', 'Service Explanation', 'Client Success Story'],
    'Fitness & Sports': ['Workout Routine', 'Nutrition Tip', 'Client Transformation', 'Equipment Guide'],
    'Fashion & Apparel': ['Style Guide', 'New Arrival', 'Behind the Design', 'Customer Styling'],
    'Beauty & Cosmetics': ['Makeup Tutorial', 'Product Benefit', 'Skincare Routine', 'Customer Review'],
    'Consulting & Coaching': ['Business Tip', 'Client Case Study', 'Methodology Explained', 'Q&A Session'],
    'Entertainment & Media': ['Behind the Scenes', 'Upcoming Release', 'Cast/Crew Feature', 'Fan Content'],
    'Non-Profit & Charity': ['Impact Story', 'Volunteer Spotlight', 'Campaign Update', 'Call to Action'],
    'Automotive': ['Car Feature', 'Maintenance Tip', 'Customer Handover', 'Test Drive Experience'],
    'Construction & Home Improvement': ['Project Update', 'Before & After', 'Safety Tip', 'Material Spotlight'],
    'Legal Services': ['Legal Tip', 'Case Study', 'Law Update', 'Attorney Spotlight'],
    'Manufacturing': ['Process Tour', 'Product Quality Check', 'Employee Feature', 'Industry Trend'],
    'Logistics & Supply Chain': ['Efficiency Tip', 'Route Update', 'Team Feature', 'Service Explanation'],
    'Agriculture & Farming': ['Farm Tour', 'Crop Update', 'Sustainability Practice', 'Equipment Highlight'],
    'Arts & Culture': ['Artist Feature', 'Event Announcement', 'Artwork Highlight', 'Behind the Art'],
    'Gaming & Esports': ['Game Highlight', 'Player Feature', 'Tournament Announcement', 'Tips & Tricks'],
    'Marketing & Advertising': ['Campaign Breakdown', 'Marketing Tip', 'Client Success', 'Industry Insight'],
    'Photography & Videography': ['Portfolio Piece', 'Shooting Tip', 'Behind the Lens', 'Client Review'],
    'Event Planning': ['Event Highlight', 'Planning Tip', 'Vendor Feature', 'Client Testimonial'],
    'Pet Services': ['Pet Care Tip', 'Cute Client Feature', 'Service Highlight', 'Product Review'],
    'Architecture & Design': ['Design Concept', 'Project Reveal', 'Material Inspiration', 'Team Feature'],
    'Human Resources': ['Culture Highlight', 'Recruitment Tip', 'Employee Spotlight', 'HR Policy Update'],
    'Energy & Utilities': ['Energy Saving Tip', 'Sustainability Goal', 'Project Update', 'Community Impact'],
    'Default': ['Educational Post', 'Entertaining Post', 'Promotional Post', 'Engaging Post']
};

exports.generateMonthlyPlan = async (org, targetYear, targetMonth, existingEventDates = []) => {
    const industry = org.industry || 'Default';
    const tone = org.brandVoice || 'Professional';
    const audience = org.targetAudience || 'General Audience';
    const country = org.country || 'IN'; // Default to IN if not specified
    const frequency = org.postingFrequency || 'Standard'; // Light, Standard, Aggressive

    const pillars = industryTemplates[industry] || industryTemplates['Default'];
    
    // Determine number of posts based on frequency
    let postsPerWeek;
    switch (frequency) {
        case 'Light': postsPerWeek = 3; break;
        case 'Aggressive': postsPerWeek = 7; break;
        case 'Standard': 
        default: postsPerWeek = 5; break;
    }

    const holidays = await holidayService.getHolidays(country, targetYear);
    
    const events = [];
    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    
    let pillarIndex = 0;

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Check if existing manual event
        if (existingEventDates.includes(dateStr)) continue;

        // Check for holidays
        const holiday = holidays.find(h => h.date === dateStr);
        if (holiday) {
            events.push({
                date: dateStr,
                title: `${holiday.name} Celebration Post`,
                notes: `Create a post celebrating ${holiday.name}. Tone: ${tone}. Audience: ${audience}.`,
                platforms: ['instagram', 'linkedin', 'facebook'],
                status: 'Idea',
                source: 'Holiday'
            });
            continue; // Skip regular post logic if it's a holiday
        }

        // Determine if we should post today (simplified distribution)
        const dateObj = new Date(targetYear, targetMonth - 1, day);
        const dayOfWeek = dateObj.getDay(); // 0 is Sunday
        
        let shouldPost = false;
        if (postsPerWeek === 7) shouldPost = true;
        else if (postsPerWeek === 5 && dayOfWeek !== 0 && dayOfWeek !== 6) shouldPost = true; // Weekdays
        else if (postsPerWeek === 3 && (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5)) shouldPost = true; // Mon, Wed, Fri

        if (shouldPost) {
            const pillar = pillars[pillarIndex % pillars.length];
            pillarIndex++;
            
            events.push({
                date: dateStr,
                title: `${pillar} - ${org.name || 'Brand'}`,
                notes: `Focus on: ${pillar}.\nTone: ${tone}.\nTarget: ${audience}.`,
                platforms: ['instagram', 'linkedin'],
                status: 'Idea',
                source: 'AI_Generated'
            });
        }
    }

    return events;
};
