require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const { initDB } = require('./databases/db');

const app = express();
const PORT = process.env.SERVER_PORT;

// Async startup function
async function startServer() {
    try {
        // 1. Initialize database first
        console.log('🔄 Initializing database...');
        await initDB();
        console.log('✅ Database initialized');

        // 2. Import routes AFTER database is ready
        const smsRoutes = require('./routes/smsRoutes');
        const userRoutes = require('./routes/userRoutes');
        const authRoutes = require('./routes/authRoutes');
        const adminRoutes = require('./routes/adminRoutes');

        // Middleware
        app.use(cors({
            origin: process.env.ALLOWED_ORIGIN || '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            credentials: false
        }));
        app.use(express.json({ limit: '10mb' }));
        app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Static files
        app.use(express.static(path.join(__dirname, 'public')));

        // Redirect root to login
        app.get('/', (req, res) => {
            res.redirect('/index.html');
        });

        // Config endpoint - serves configuration to frontend
        app.get('/api/config', (req, res) => {
            res.json({
                SERVER_IP: process.env.SERVER_IP,
                SERVER_PORT: process.env.SERVER_PORT,
                ENDPOINTS: {
                    SEND_SMS: process.env.ENDPOINT_SEND_SMS,
                    CANCEL: process.env.ENDPOINT_CANCEL,
                    CHECK_GATEWAY: process.env.ENDPOINT_CHECK_GATEWAY,
                    COUNT_LOGS: process.env.ENDPOINT_COUNT_LOGS,
                    USERS: process.env.ENDPOINT_USERS,
                    LOGIN: process.env.ENDPOINT_LOGIN,
                    SERVER_INFO: process.env.ENDPOINT_SERVER_INFO
                },
                STORAGE_KEYS: {
                    ID: process.env.STORAGE_KEY_ID,
                    NAME: process.env.STORAGE_KEY_NAME,
                    NUMBER: process.env.STORAGE_KEY_NUMBER,
                    FORM_DATA: process.env.STORAGE_KEY_FORM_DATA,
                    CURRENT_USER: process.env.STORAGE_KEY_CURRENT_USER
                }
            });
        });

        // API Routes
        app.use('/api', smsRoutes);
        app.use('/api', userRoutes);
        app.use('/api/auth', authRoutes);
        app.use('/api/admin', adminRoutes);

        // 404 handler (must come after all routes)
        app.use((req, res, next) => {
            res.status(404).json({
                success: false,
                message: `Route not found: ${req.method} ${req.originalUrl}`
            });
        });

        // Error handling middleware (must be last, with 4 params)
        app.use((err, req, res, next) => {
            console.error('Server error:', err);
            res.status(err.status || 500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        });

        // 3. Start queue worker AFTER database is ready
        const queueWorker = require('./controllers/queueController');
        queueWorker.startWorker();

        // Graceful shutdown
        function gracefulShutdown(signal) {
            console.log(`\n🛑 ${signal} received. Shutting down gracefully...`);
            process.exit(0);
        }

        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

        // 4. Start Express server
        app.listen(PORT, '0.0.0.0', () => {
            const serverIP = process.env.SERVER_IP;
            console.log('═══════════════════════════════════════');
            console.log(`🚀 Bulk SMS Server Started`);
            console.log(`📡 Server: http://${serverIP}:${PORT}`);
            console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`⏰ Started: ${new Date().toLocaleString()}`);
            console.log('═══════════════════════════════════════');
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();

module.exports = app;