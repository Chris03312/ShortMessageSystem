const Database = require('better-sqlite3');
const path = require('path');

// Database file path
const dbPath = path.join(__dirname, 'sms_system.db');

// Initialize database
const db = new Database(dbPath, {
    verbose: console.log,
    fileMustExist: false
});

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = -64000'); // 64MB cache

console.log('📦 Database connected:', dbPath);

// Create tables
const initDB = () => {
    console.log('🔧 Initializing database tables...');

    // Users table
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            password TEXT NOT NULL,
            status TEXT DEFAULT 'Inactive',
            created_at DATETIME DEFAULT (DATETIME('now', 'localtime'))
        )
    `);

    // Agent numbers table (tracks active phone numbers per user)
    db.exec(`
        CREATE TABLE IF NOT EXISTS agentNumbers (
            id TEXT NOT NULL,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            status TEXT DEFAULT 'Active',
            datetime DATETIME DEFAULT (DATETIME('now', 'localtime')),
            PRIMARY KEY (id, phone)
        )
    `);

    // SMS queue table
    db.exec(`
        CREATE TABLE IF NOT EXISTS sms_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone TEXT NOT NULL,
            message TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            gatewayUrl TEXT NOT NULL,
            gatewayToken TEXT NOT NULL,
            created_at DATETIME DEFAULT (DATETIME('now', 'localtime')),
            updated_at DATETIME DEFAULT (DATETIME('now', 'localtime'))
        )
    `);

    // Blacklist table
    db.exec(`
        CREATE TABLE IF NOT EXISTS blacklist (
            phone TEXT PRIMARY KEY,
            created_at DATETIME DEFAULT (DATETIME('now', 'localtime'))
        )
    `);

    // SMS logs table (optional - for database logs)
    db.exec(`
        CREATE TABLE IF NOT EXISTS sms_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId TEXT NOT NULL,
            userName TEXT NOT NULL,
            phone TEXT NOT NULL,
            status TEXT NOT NULL,
            gateway TEXT,
            details TEXT,
            datetime DATETIME DEFAULT (DATETIME('now', 'localtime'))
        )
    `);

    // Create indexes for better performance
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_queue_status ON sms_queue(status);
        CREATE INDEX IF NOT EXISTS idx_queue_token ON sms_queue(gatewayToken);
        CREATE INDEX IF NOT EXISTS idx_agent_status ON agentNumbers(status);
        CREATE INDEX IF NOT EXISTS idx_agent_phone ON agentNumbers(phone);
        CREATE INDEX IF NOT EXISTS idx_logs_user ON sms_logs(userId);
        CREATE INDEX IF NOT EXISTS idx_logs_datetime ON sms_logs(datetime);
    `);

    console.log('✅ Database tables initialized');

    // Insert default admin user if not exists
    const adminExists = db.prepare('SELECT id FROM users WHERE id = ?').get('admin');

    if (!adminExists) {
        const bcrypt = require('bcryptjs');
        const hashedPassword = bcrypt.hashSync('admin123', 10);

        db.prepare(`
            INSERT INTO users (id, name, password, status)
            VALUES (?, ?, ?, ?)
        `).run('admin', 'Administrator', hashedPassword, 'Active');

        console.log('✅ Default admin user created (admin/admin123)');
    }
};

// Initialize tables
initDB();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Closing database connection...');
    db.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Closing database connection...');
    db.close();
    process.exit(0);
});

module.exports = db;