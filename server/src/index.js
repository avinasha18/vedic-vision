import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Import configurations and middleware
import connectDB from './config/database.js';
import apiRoutes from './routes/index.js';

// Configure environment variables
dotenv.config();

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();

// Create required directories
const createDirectories = () => {
    const directories = [
        'uploads',
        'uploads/submissions',
        'uploads/announcements',
        'exports'
    ];

    directories.forEach(dir => {
        const dirPath = path.join(process.cwd(), dir);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            console.log(`Created directory: ${dir}`);
        }
    });
};

// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files for uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// API Routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to Vedic Vision API',
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
            users: '/api/users',
            tasks: '/api/tasks',
            submissions: '/api/submissions',
            attendance: '/api/attendance',
            announcements: '/api/announcements',
            exports: '/api/export'
        },
        documentation: 'Please refer to the API documentation for detailed usage'
    });
});

// Global error handling middleware
app.use((error, req, res, next) => {
    console.error('Global Error Handler:', error);

    // Handle specific error types
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors: Object.values(error.errors).map(err => err.message)
        });
    }

    if (error.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID format'
        });
    }

    if (error.code === 11000) {
        return res.status(400).json({
            success: false,
            message: 'Duplicate field value',
            field: Object.keys(error.keyValue)[0]
        });
    }

    // Default error response
    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
});

// 404 handler for non-API routes
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
        suggestion: 'Check the API documentation for available endpoints'
    });
});

// Server configuration
const PORT = process.env.PORT || 9000;

// Initialize server
const startServer = async () => {
    try {
        // Create required directories
        createDirectories();

        // Connect to database
        await connectDB();

        // Start server
        app.listen(PORT, () => {
            console.log('\n🚀 Vedic Vision Server Started Successfully!');
            console.log(`📡 Server running on port ${PORT}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📊 Database: ${process.env.MONGODB_URI ? 'Connected' : 'Default (localhost)'}`);
            console.log(`🔗 Server URL: http://localhost:${PORT}`);
            console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
            console.log('\n📚 Available API Endpoints:');
            console.log('   Authentication: /api/auth');
            console.log('   Users: /api/users');
            console.log('   Tasks: /api/tasks');
            console.log('   Submissions: /api/submissions');
            console.log('   Attendance: /api/attendance');
            console.log('   Announcements: /api/announcements');
            console.log('   Exports: /api/export');
            console.log('\n✅ Server is ready to handle requests!\n');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Promise Rejection:', err.message);
    console.log('🔄 Shutting down server...');
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err.message);
    console.log('🔄 Shutting down server...');
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🔄 SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n🔄 SIGINT received. Shutting down gracefully...');
    process.exit(0);
});

// Start the server
startServer();