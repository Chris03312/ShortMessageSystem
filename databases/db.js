const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'sms_system.db');

let db = null;
let saveInterval = null;

// ─── Persistence ─────────────────────────────────────────────────────────────

function saveDb() {
    if (!db) return;
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
}

// ─── Schema + seed ───────────────────────────────────────────────────────────

function applySchema() {
    db.run(`PRAGMA journal_mode = WAL`);
    db.run(`PRAGMA synchronous = NORMAL`);
    db.run(`PRAGMA cache_size = -64000`);

    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            password TEXT NOT NULL,
            status TEXT DEFAULT 'Inactive',
            created_at DATETIME DEFAULT (DATETIME('now', 'localtime'))
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS agentNumbers (
            id TEXT NOT NULL,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            status TEXT DEFAULT 'Active',
            datetime DATETIME DEFAULT (DATETIME('now', 'localtime')),
            PRIMARY KEY (id, phone)
        )
    `);

    db.run(`
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

    db.run(`
        CREATE TABLE IF NOT EXISTS blacklist (
            phone TEXT PRIMARY KEY,
            created_at DATETIME DEFAULT (DATETIME('now', 'localtime'))
        )
    `);

    db.run(`
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

    db.run(`
        CREATE TABLE IF NOT EXISTS user_sessions (
            session_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT,
            phone TEXT,
            created_at DATETIME DEFAULT (DATETIME('now', 'localtime')),
            last_active DATETIME DEFAULT (DATETIME('now', 'localtime'))
        )
    `);

    db.run(`CREATE INDEX IF NOT EXISTS idx_queue_status  ON sms_queue(status)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_queue_token   ON sms_queue(gatewayToken)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_agent_status  ON agentNumbers(status)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_agent_phone   ON agentNumbers(phone)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_logs_user     ON sms_logs(userId)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_logs_datetime ON sms_logs(datetime)`);

    // Seed default admin if missing
    const rows = db.exec(`SELECT id FROM users WHERE id = 'admin'`);
    const adminExists = rows.length > 0 && rows[0].values.length > 0;
    if (!adminExists) {
        const hashed = bcrypt.hashSync('admin123', 10);
        db.run(
            `INSERT INTO users (id, name, password, status) VALUES (?, ?, ?, ?)`,
            ['admin', 'Administrator', hashed, 'Active']
        );
        console.log('✅ Default admin created (admin / admin123)');
    }

    console.log('✅ Database tables initialized');
}

// ─── Public async initializer ────────────────────────────────────────────────
// Call ONCE at app startup, before requiring any Model file.

async function initDB() {
    if (db) return; // already initialized

    const SQL = await initSqlJs();

    if (fs.existsSync(dbPath)) {
        const buf = fs.readFileSync(dbPath);
        db = new SQL.Database(buf);
        console.log('📦 Database loaded:', dbPath);
    } else {
        db = new SQL.Database();
        console.log('📦 New database created:', dbPath);
    }

    applySchema();
    saveDb();

    // Auto-save every 5 s
    saveInterval = setInterval(saveDb, 5000);

    console.log('📦 Database ready');
}

// ─── Query helpers ────────────────────────────────────────────────────────────

function assertReady() {
    if (!db) throw new Error('Database not initialised — call await initDB() before starting the server');
}

/**
 * Returns an array of plain row objects for a SELECT.
 */
function all(sql, params = []) {
    assertReady();
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
}

/**
 * Returns the first row object or undefined.
 */
function get(sql, params = []) {
    assertReady();
    const stmt = db.prepare(sql);
    stmt.bind(params);
    let row;
    if (stmt.step()) row = stmt.getAsObject();
    stmt.free();
    return row;
}

/**
 * Runs an INSERT / UPDATE / DELETE.
 * Returns { changes, lastInsertRowid }.
 */
function run(sql, params = []) {
    assertReady();
    db.run(sql, params);
    const changes = db.getRowsModified();
    const lastRow = get('SELECT last_insert_rowid() as id');
    const lastInsertRowid = lastRow ? lastRow.id : null;
    saveDb();
    return { changes, lastInsertRowid };
}

/**
 * Wraps multiple operations in a transaction.
 * Returns a zero-argument function; call it to execute.
 * fn receives { run, get, all } and must be synchronous.
 */
function transaction(fn) {
    return () => {
        assertReady();
        db.run('BEGIN');
        try {
            const result = fn({ run, get, all });
            db.run('COMMIT');
            saveDb();
            return result;
        } catch (err) {
            db.run('ROLLBACK');
            throw err;
        }
    };
}

// ─── Graceful shutdown ────────────────────────────────────────────────────────

function shutdown() {
    console.log('\n🛑 Closing database...');
    clearInterval(saveInterval);
    saveDb();
    if (db) db.close();
    process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = { initDB, all, get, run, transaction };