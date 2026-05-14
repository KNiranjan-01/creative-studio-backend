const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const session = require('express-session');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// ─── Core Middleware ──────────────────────────────────────────────────────────

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS — allow frontend origin with credentials
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Session — used only for OAuth state management during the OAuth flow
app.use(session({
    secret: process.env.SESSION_SECRET || 'creative-studio-oauth-session-secret-change-in-prod',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 15 * 60 * 1000 // 15 minutes — enough for any OAuth flow
    }
}));

// ─── Rate Limiting ────────────────────────────────────────────────────────────

app.use(generalLimiter);

// ─── API Routes ───────────────────────────────────────────────────────────────

const authRoutes = require('./routes/auth.routes');
const connectionsRoutes = require('./routes/connections.routes');
const publishRoutes = require('./routes/publish.routes');
const organizationRoutes = require('./routes/organization.routes');
const adminRoutes = require('./routes/admin.routes');
const teamRoutes = require('./routes/team.routes');

app.use('/api/auth', authRoutes);
app.use('/api/connections', connectionsRoutes);
app.use('/api/publish', publishRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/team', teamRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Creative Studio API is running', timestamp: new Date().toISOString() });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────

app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
    }
    next();
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`\n🚀 Creative Studio API running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}\n`);
});

// Handle unhandled promise rejections gracefully
process.on('unhandledRejection', (err) => {
    console.error(`\n[FATAL] Unhandled Promise Rejection: ${err.message}`);
    server.close(() => process.exit(1));
});