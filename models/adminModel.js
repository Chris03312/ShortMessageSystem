const { all, get, run, transaction } = require('../databases/db');
const fs = require('fs');
const path = require('path');

function getLocalDate() {
    const now = new Date();
    const offset = 8 * 60; // UTC+8 Philippines
    const local = new Date(now.getTime() + offset * 60 * 1000);
    return local.toISOString().slice(0, 10); // "2026-03-14"
}

class AdminModel {
    static getDashboardStats() {
        run(
            `DELETE FROM sms_queue WHERE DATE(created_at) < DATE('now', 'localtime')`,
            []
        );

        const totalUsersRow = get(`SELECT COUNT(*) as total FROM users`);
        const totalUsers = totalUsersRow ? totalUsersRow.total : 0;

        const queueStats = get(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing
            FROM sms_queue
        `);

        const today = getLocalDate();
        const logsDir = path.join(__dirname, '..', 'public', 'logs');
        let totalSent = 0;
        let totalFailed = 0;

        if (fs.existsSync(logsDir)) {
            const files = fs.readdirSync(logsDir);
            files.forEach(file => {
                if (file.startsWith('sent_') && file.includes(today)) {
                    const content = fs.readFileSync(path.join(logsDir, file), 'utf8').trim();
                    if (content) totalSent += content.split('\n').filter(Boolean).length;
                }
                if (file.startsWith('FAILED_') && file.includes(today)) {
                    const content = fs.readFileSync(path.join(logsDir, file), 'utf8').trim();
                    if (content) totalFailed += content.split('\n').filter(Boolean).length;
                }
            });
        }

        return {
            totalUsers,
            totalSent,
            totalFailed,
            totalQueued: (queueStats && queueStats.pending) || 0
        };
    }

    static getAllUsers(page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const users = all(
            `SELECT id, name, status, created_at as lastActive 
             FROM users 
             ORDER BY created_at DESC 
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );
        const totalRow = get(`SELECT COUNT(*) as total FROM users`);
        const total = totalRow ? totalRow.total : 0;

        const today = getLocalDate();
        const logsDir = path.join(__dirname, '..', 'public', 'logs');
        const sentLogFile = path.join(logsDir, `sent_${today}.txt`);
        let sentLogs = [];

        if (fs.existsSync(sentLogFile)) {
            const content = fs.readFileSync(sentLogFile, 'utf8').trim();
            if (content) sentLogs = content.split('\n').filter(Boolean);
        }

        return {
            data: users.map(user => {
                const activePhone = get(
                    `SELECT phone FROM agentNumbers WHERE id = ? AND status = 'Active' LIMIT 1`,
                    [user.id]
                );
                const sentToday = sentLogs.filter(line =>
                    line.includes(`Blaster: ${user.name.trim()}`)
                ).length;
                return { ...user, phone: activePhone ? activePhone.phone : 'N/A', sentToday };
            }),
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    static getUserById(userId) {
        const user = get(
            `SELECT id, name, status, created_at FROM users WHERE id = ?`,
            [userId]
        );
        if (!user) return null;

        const activePhone = get(
            `SELECT phone FROM agentNumbers WHERE id = ? AND status = 'Active' LIMIT 1`,
            [userId]
        );

        const today = getLocalDate();
        const logsDir = path.join(__dirname, '..', 'public', 'logs');
        let sentToday = 0;
        let totalSent = 0;

        if (fs.existsSync(logsDir)) {
            const files = fs.readdirSync(logsDir);
            files.forEach(file => {
                if (file.startsWith('sent_') && !file.includes('FAILED')) {
                    const content = fs.readFileSync(path.join(logsDir, file), 'utf8').trim();
                    if (content) {
                        const lines = content.split('\n').filter(Boolean);
                        const userLines = lines.filter(l => l.includes(`Blaster: ${user.name}`));
                        totalSent += userLines.length;
                        if (file.includes(today)) sentToday = userLines.length;
                    }
                }
            });
        }

        return {
            ...user,
            phone: activePhone ? activePhone.phone : 'N/A',
            sentToday,
            totalSent
        };
    }

    static getUserByUsername(username) {
        return get(`SELECT * FROM users WHERE id = ?`, [username]);
    }

    static createUser(userData) {
        return run(
            `INSERT INTO users (id, name, password, status, created_at) VALUES (?, ?, ?, ?, DATETIME('now', 'localtime'))`,
            [userData.userId, userData.name, userData.password, userData.status || 'Inactive']
        );
    }

    static deactivateUser(userId) {
        const deactivateAll = transaction(({ run: txRun }) => {
            txRun(
                `UPDATE agentNumbers SET status = 'Inactive', datetime = DATETIME('now', 'localtime') WHERE id = ?`,
                [userId]
            );
            return txRun(
                `UPDATE users SET status = 'Inactive' WHERE id = ?`,
                [userId]
            );
        });
        return deactivateAll();
    }

    static activateUser(userId) {
        const activateAll = transaction(({ run: txRun }) => {
            txRun(
                `UPDATE agentNumbers SET status = 'Active', datetime = DATETIME('now', 'localtime') WHERE id = ?`,
                [userId]
            );
            return txRun(
                `UPDATE users SET status = 'Active' WHERE id = ?`,
                [userId]
            );
        });
        return activateAll();
    }

    static deleteUser(userId) {
        const deleteAll = transaction(({ run: txRun }) => {
            txRun(`DELETE FROM agentNumbers WHERE id = ?`, [userId]);
            return txRun(`DELETE FROM users WHERE id = ?`, [userId]);
        });
        return deleteAll();
    }

    static getUserLogs(userId = null, date = null, page = 1, limit = 15) {
        const logsDir = path.join(__dirname, '..', 'public', 'logs');
        let logs = [];

        if (!fs.existsSync(logsDir)) {
            return { data: [], pagination: { total: 0, page, limit, totalPages: 0 } };
        }

        const targetDate = date || new Date().toISOString().slice(0, 10);

        const sentLogFile = path.join(logsDir, `sent_${targetDate}.txt`);
        if (fs.existsSync(sentLogFile)) {
            const content = fs.readFileSync(sentLogFile, 'utf8').trim();
            if (content) {
                content.split('\n').filter(Boolean).forEach(line => {
                    const match = line.match(/Blaster: (.+?) - Sent by: (.+?) to: (.+?) - (.+?) (.+)/);
                    if (match) {
                        logs.push({
                            userName: match[1],
                            sentBy: match[2],
                            phone: match[3],
                            date: match[4],
                            time: match[5],
                            timestamp: `${match[4]} ${match[5]}`,
                            status: 'sent',
                            gateway: 'N/A',
                            details: 'Sent successfully'
                        });
                    }
                });
            }
        }

        const failedLogFile = path.join(logsDir, `FAILED_${targetDate}.txt`);
        if (fs.existsSync(failedLogFile)) {
            const content = fs.readFileSync(failedLogFile, 'utf8').trim();
            if (content) {
                content.split('\n').filter(Boolean).forEach(line => {
                    const match = line.match(/(.+?) - (.+?) - (.+)/);
                    if (match) {
                        logs.push({
                            timestamp: match[1],
                            phone: match[2],
                            status: 'failed',
                            details: match[3],
                            userName: 'N/A',
                            sentBy: 'N/A',
                            gateway: 'N/A'
                        });
                    }
                });
            }
        }

        if (userId) {
            logs = logs.filter(log => log.sentBy === userId || log.userName === userId);
        }

        logs = logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const total = logs.length;
        const offset = (page - 1) * limit;
        return {
            data: logs.slice(offset, offset + limit),
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
        };
    }

    static getAllPhoneNumbers(filter = 'all', page = 1, limit = 10) {
        const agentNumbers = all(
            `SELECT id, name, phone, status, datetime as lastSent FROM agentNumbers ORDER BY datetime DESC`,
            []
        );
        const blacklistedRows = all(`SELECT phone FROM blacklist`, []);
        const blacklisted = new Set(blacklistedRows.map(b => b.phone));

        const logsDir = path.join(__dirname, '..', 'public', 'logs');
        const phoneCountMap = new Map();

        if (fs.existsSync(logsDir)) {
            const files = fs.readdirSync(logsDir);
            files.forEach(file => {
                if (file.startsWith('sent_')) {
                    const content = fs.readFileSync(path.join(logsDir, file), 'utf8').trim();
                    if (content) {
                        content.split('\n').filter(Boolean).forEach(line => {
                            const match = line.match(/to: (.+?) -/);
                            if (match) {
                                const phone = match[1];
                                phoneCountMap.set(phone, (phoneCountMap.get(phone) || 0) + 1);
                            }
                        });
                    }
                }
            });
        }

        let numbers = agentNumbers.map(agent => ({
            phone: agent.phone,
            userName: agent.name,
            timesSent: phoneCountMap.get(agent.phone) || 0,
            lastSent: agent.lastSent,
            blacklisted: blacklisted.has(agent.phone),
            agentId: agent.id,
            status: agent.status
        }));

        if (filter === 'blacklisted') {
            numbers = numbers.filter(n => n.blacklisted);
        } else if (filter === 'active') {
            numbers = numbers.filter(n => !n.blacklisted && n.status === 'Active');
        }

        numbers = numbers.sort((a, b) => b.timesSent - a.timesSent);
        const total = numbers.length;
        const offset = (page - 1) * limit;
        return {
            data: numbers.slice(offset, offset + limit),
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
        };
    }

    static deletePhoneNumber(phone) {
        return run(`DELETE FROM agentNumbers WHERE phone = ?`, [phone]);
    }

    static updateAgentNumberStatus(phone, status) {
        return run(
            `UPDATE agentNumbers SET status = ?, datetime = DATETIME('now', 'localtime') WHERE phone = ?`,
            [status, phone]
        );
    }

    static blacklistPhoneNumber(phone) {
        return run(
            `INSERT OR IGNORE INTO blacklist (phone, created_at) VALUES (?, DATETIME('now', 'localtime'))`,
            [phone]
        );
    }

    static getRecentActivity(limit = 20) {
        const result = this.getUserLogs(null, null, 1, limit);
        return result.data.map(log => ({
            ...log,
            action: log.status === 'sent' ? 'sent message' : 'failed to send message'
        }));
    }
}

module.exports = AdminModel;