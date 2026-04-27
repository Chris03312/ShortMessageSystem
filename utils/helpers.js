const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'public', 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Delay utility
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate() {
    return new Date().toISOString().slice(0, 10);
}

/**
 * Get current time in HH:MM:SS format
 */
function getCurrentTime() {
    return new Date().toLocaleTimeString('en-US', { hour12: false });
}

/**
 * Sanitize name for filename
 */
function sanitizeName(name) {
    return name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
}

/**
 * Log sent number to consolidated sent log
 */
function logSentNumber(userName, phone, sentBy) {
    try {
        const today = getTodayDate();
        const time = getCurrentTime();
        const filename = path.join(logsDir, `sent_${today}.txt`);

        const logEntry = `Blaster: ${userName} - Sent by: ${sentBy} to: ${phone} - ${today} ${time}\n`;

        fs.appendFileSync(filename, logEntry, 'utf8');
        console.log(`📝 Logged sent: ${phone}`);
    } catch (err) {
        console.error('Error logging sent number:', err.message);
    }
}

/**
 * Log failed number to consolidated failed log
 */
function logFailedNumber(userName, phone, errorMessage) {
    try {
        const today = getTodayDate();
        const time = getCurrentTime();
        const filename = path.join(logsDir, `FAILED_${today}.txt`);

        const logEntry = `${today} ${time} - ${phone} - ${errorMessage} - User: ${userName}\n`;

        fs.appendFileSync(filename, logEntry, 'utf8');
        console.log(`📝 Logged failed: ${phone}`);
    } catch (err) {
        console.error('Error logging failed number:', err.message);
    }
}

/**
 * Log queue retry failure
 */
function logQueueRetryFailed(phone, errorMessage) {
    try {
        const today = getTodayDate();
        const time = getCurrentTime();
        const filename = path.join(logsDir, `FAILED_${today}.txt`);

        const logEntry = `${today} ${time} - ${phone} - Queue Retry Failed: ${errorMessage}\n`;

        fs.appendFileSync(filename, logEntry, 'utf8');
        console.log(`📝 Logged queue retry failed: ${phone}`);
    } catch (err) {
        console.error('Error logging queue retry:', err.message);
    }
}

/**
 * Count sent logs for a specific user today
 */

function countSentLogs(userName) {
    try {
        const today = getTodayDate();
        const filename = path.join(logsDir, `sent_${today}.txt`);

        if (!fs.existsSync(filename)) {
            return 0;
        }

        const content = fs.readFileSync(filename, 'utf8').trim();
        if (!content) {
            return 0;
        }

        const lines = content.split('\n');

        // Count lines where userName matches the "Blaster:" field
        let count = 0;
        for (const line of lines) {
            const match = line.match(/Blaster: (.+?) - Sent by:/);
            if (match && match[1] === userName) {
                count++;
            }
        }

        return count;
    } catch (err) {
        console.error('Error counting sent logs:', err.message);
        return 0;
    }
}

/**
 * Get all logs for a specific date
 */
function getLogsByDate(date) {
    const logs = [];

    try {
        // Read sent logs
        const sentFile = path.join(logsDir, `sent_${date}.txt`);
        if (fs.existsSync(sentFile)) {
            const content = fs.readFileSync(sentFile, 'utf8').trim();
            if (content) {
                const lines = content.split('\n');
                lines.forEach(line => {
                    const match = line.match(/Blaster: (.+?) - Sent by: (.+?) to: (.+?) - (.+?) (.+)/);
                    if (match) {
                        logs.push({
                            type: 'sent',
                            userName: match[1],
                            sentBy: match[2],
                            phone: match[3],
                            date: match[4],
                            time: match[5],
                            timestamp: `${match[4]} ${match[5]}`
                        });
                    }
                });
            }
        }

        // Read failed logs
        const failedFile = path.join(logsDir, `FAILED_${date}.txt`);
        if (fs.existsSync(failedFile)) {
            const content = fs.readFileSync(failedFile, 'utf8').trim();
            if (content) {
                const lines = content.split('\n');
                lines.forEach(line => {
                    const match = line.match(/(.+?) (.+?) - (.+?) - (.+?) - User: (.+)/);
                    if (match) {
                        logs.push({
                            type: 'failed',
                            date: match[1],
                            time: match[2],
                            phone: match[3],
                            error: match[4],
                            userName: match[5],
                            timestamp: `${match[1]} ${match[2]}`
                        });
                    }
                });
            }
        }
    } catch (err) {
        console.error('Error reading logs:', err.message);
    }

    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

/**
 * Clean old logs (optional - keep last 30 days)
 */
function cleanOldLogs(daysToKeep = 30) {
    try {
        const files = fs.readdirSync(logsDir);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        files.forEach(file => {
            const filePath = path.join(logsDir, file);
            const stats = fs.statSync(filePath);

            if (stats.mtime < cutoffDate) {
                fs.unlinkSync(filePath);
                console.log(`🗑️ Deleted old log: ${file}`);
            }
        });
    } catch (err) {
        console.error('Error cleaning old logs:', err.message);
    }
}

module.exports = {
    delay,
    getTodayDate,
    getCurrentTime,
    sanitizeName,
    logSentNumber,
    logFailedNumber,
    logQueueRetryFailed,
    countSentLogs,
    getLogsByDate,
    cleanOldLogs
};