const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/user.model');
const connectDB = require('../config/db');

// Load env vars
dotenv.config();

const createSuperAdmin = async () => {
    try {
        await connectDB();

        const email = process.env.SUPER_ADMIN_EMAIL || 'superadmin@creativestudio.com';
        const password = process.env.SUPER_ADMIN_PASSWORD || 'SuperSecret123!';
        const fullName = process.env.SUPER_ADMIN_NAME || 'Super Administrator';

        // Check if user already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            console.log(`Super admin with email ${email} already exists.`);
            // Update role to super_admin if not already
            if (existingUser.role !== 'super_admin') {
                existingUser.role = 'super_admin';
                await existingUser.save();
                console.log(`Updated existing user's role to super_admin.`);
            }
        } else {
            // Create super admin
            const superAdmin = await User.create({
                fullName,
                email,
                password,
                role: 'super_admin'
            });
            console.log(`Successfully created Super Admin Account:`);
            console.log(`Email: ${email}`);
            console.log(`Password: ${password}`);
        }

        console.log('Seeding completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error(`Error seeding super admin: ${error.message}`);
        process.exit(1);
    }
};

createSuperAdmin();
