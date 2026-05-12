const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Please provide your full name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        index: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false // hidden by default
    },
    refreshToken: {
        type: String,
        select: false
    }
}, { timestamps: true });

// Pre-save hook to hash password
userSchema.pre('save', async function () {
    // Only run this function if password was actually modified
    if (!this.isModified('password')) return;

    // Hash the password with cost of 15
    const salt = await bcrypt.genSalt(15);
    this.password = await bcrypt.hash(this.password, salt);
});

// Instance method to check password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
