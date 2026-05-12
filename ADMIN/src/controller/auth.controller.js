const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const crypto = require('crypto');

// Helper function to generate tokens
const generateTokens = (id) => {
    const accessToken = jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1h'
    });

    const refreshToken = jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: '30d'
    });

    return { accessToken, refreshToken };
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
    const { fullName, email, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(409).json({ success: false, message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
        fullName,
        email,
        password
    });

    const { accessToken, refreshToken } = generateTokens(user._id);

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.status(201).json({
        success: true,
        accessToken,
        refreshToken,
        user: {
            id: user._id,
            fullName: user.fullName,
            email: user.email
        }
    });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true,
        accessToken,
        refreshToken,
        user: {
            id: user._id,
            fullName: user.fullName,
            email: user.email
        }
    });
});

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
exports.refresh = asyncHandler(async (req, res, next) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ success: false, message: 'Refresh token is required' });
    }

    try {
        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        // Check if user exists and token matches
        const user = await User.findById(decoded.id).select('+refreshToken');
        
        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({ success: false, message: 'Invalid refresh token' });
        }

        // Generate new tokens (Token rotation)
        const tokens = generateTokens(user._id);

        user.refreshToken = tokens.refreshToken;
        await user.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken
        });
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }
});

// @desc    Logout user / clear refresh token
// @route   POST /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    if (user) {
        user.refreshToken = undefined;
        await user.save({ validateBeforeSave: false });
    }

    res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        user
    });
});
