const CalendarEvent = require('../models/calendarEvent.model');
const { generateMonthlyPlan } = require('../utils/calendarGenerator');
const holidayService = require('../service/holiday.service');

// @desc    Generate AI Content Calendar (Preview)
// @route   POST /api/calendar/generate
// @access  Private (Owner, Manager, Editor)
exports.generateCalendar = async (req, res, next) => {
    try {
        const { year, month } = req.body;
        
        if (!year || !month) {
            return res.status(400).json({ success: false, message: 'Year and month are required' });
        }

        const org = req.org;
        
        // Find existing manual events for the month
        const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
        const endOfMonth = `${year}-${String(month).padStart(2, '0')}-31`; // Simplified bounds
        
        const existingEvents = await CalendarEvent.find({
            orgId: org._id,
            date: { $gte: startOfMonth, $lte: endOfMonth },
            source: 'Manual'
        }).select('date');

        const existingEventDates = existingEvents.map(e => e.date);

        const previewEvents = await generateMonthlyPlan(org, parseInt(year), parseInt(month), existingEventDates);

        res.status(200).json({
            success: true,
            data: previewEvents
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Confirm and Save Calendar
// @route   POST /api/calendar/confirm
// @access  Private
exports.confirmCalendar = async (req, res, next) => {
    try {
        const { events } = req.body;
        
        if (!events || !Array.isArray(events)) {
            return res.status(400).json({ success: false, message: 'Events array is required' });
        }

        const orgId = req.org._id;
        const mappedEvents = events.map(e => ({
            ...e,
            orgId,
            createdBy: req.user._id
        }));

        const savedEvents = await CalendarEvent.insertMany(mappedEvents);

        res.status(201).json({
            success: true,
            data: savedEvents
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all events for an organization (optionally filtered by month/year)
// @route   GET /api/calendar
// @access  Private
exports.getEvents = async (req, res, next) => {
    try {
        const { year, month } = req.query;
        let query = { orgId: req.org._id };

        if (year && month) {
            const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
            const endOfMonth = `${year}-${String(month).padStart(2, '0')}-31`;
            query.date = { $gte: startOfMonth, $lte: endOfMonth };
        }

        const events = await CalendarEvent.find(query).sort({ date: 1 });

        res.status(200).json({
            success: true,
            data: events
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a single event
// @route   POST /api/calendar
// @access  Private
exports.createEvent = async (req, res, next) => {
    try {
        const eventData = { ...req.body, orgId: req.org._id, createdBy: req.user._id, source: 'Manual' };
        const event = await CalendarEvent.create(eventData);

        res.status(201).json({
            success: true,
            data: event
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update a single event
// @route   PUT /api/calendar/:id
// @access  Private
exports.updateEvent = async (req, res, next) => {
    try {
        const event = await CalendarEvent.findOneAndUpdate(
            { _id: req.params.id, orgId: req.org._id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        res.status(200).json({
            success: true,
            data: event
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a single event
// @route   DELETE /api/calendar/:id
// @access  Private
exports.deleteEvent = async (req, res, next) => {
    try {
        const event = await CalendarEvent.findOneAndDelete({ _id: req.params.id, orgId: req.org._id });

        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Bulk delete events (e.g., clearing AI generated events for a month)
// @route   DELETE /api/calendar/bulk
// @access  Private
exports.bulkDelete = async (req, res, next) => {
    try {
        const { ids, year, month } = req.body;
        let query = { orgId: req.org._id };

        if (ids && Array.isArray(ids)) {
            query._id = { $in: ids };
        } else if (year && month) {
             const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
             const endOfMonth = `${year}-${String(month).padStart(2, '0')}-31`;
             query.date = { $gte: startOfMonth, $lte: endOfMonth };
             // Optional: only delete AI generated ones if you want to be safe
             // query.source = { $ne: 'Manual' }; 
        } else {
             return res.status(400).json({ success: false, message: 'Must provide either ids or year/month to bulk delete' });
        }

        const result = await CalendarEvent.deleteMany(query);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get holidays for a month/year
// @route   GET /api/calendar/holidays
// @access  Private
exports.getHolidays = async (req, res, next) => {
    try {
        const { year } = req.query;
        if (!year) return res.status(400).json({ success: false, message: 'Year is required' });
        
        const country = req.org?.country || 'IN';
        const holidays = await holidayService.getHolidays(country, parseInt(year));
        
        res.status(200).json({
            success: true,
            data: holidays
        });
    } catch (error) {
        next(error);
    }
};
