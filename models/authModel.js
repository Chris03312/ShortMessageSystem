const { all, get, run, transaction } = require('../databases/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

class AuthModel {
    static async authenticateUser(userId, password) {
        try {
            const user = get(`SELECT * FROM users WHERE id = ?`, [userId]);
            if (!user) return null;
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) return null;
            const { password: _, ...userWithoutPassword } = user;
            return userWithoutPassword;
        } catch (err) {
            console.error('Authentication error:', err.message);
            return null;
        }
    }

    static getUserById(userId) {
        try {
            const user = get(`SELECT * FROM users WHERE id = ?`, [userId]);
            if (user) {
                const { password, ...userWithoutPassword } = user;
                return userWithoutPassword;
            }
            return null;
        } catch (err) {
            console.error('Get user error:', err.message);
            return null;
        }
    }

    static getActiveAgentNumberById(userId) {
        try {
            return get(
                `SELECT * FROM agentNumbers WHERE id = ? AND status = 'Active'`,
                [userId]
            );
        } catch (err) {
            console.error('Get active agent number error:', err.message);
            return null;
        }
    }

    static getAgentNumberByUserAndPhone(userId, phone) {
        try {
            return get(
                `SELECT * FROM agentNumbers WHERE id = ? AND phone = ?`,
                [userId, phone]
            );
        } catch (err) {
            console.error('Get agent number by user and phone error:', err.message);
            return null;
        }
    }

    static setUserStatus(userId, status) {
        try {
            return run(`UPDATE users SET status = ? WHERE id = ?`, [status, userId]);
        } catch (err) {
            console.error('Set user status error:', err.message);
            throw err;
        }
    }

    static deactivateAgentNumber(userId) {
        try {
            return run(
                `UPDATE agentNumbers SET status = 'Inactive', datetime = DATETIME('now', 'localtime') WHERE id = ?`,
                [userId]
            );
        } catch (err) {
            console.error('Deactivate agent number error:', err.message);
            return { success: false, message: 'Failed to deactivate agent number' };
        }
    }

    // ─── Multi-tab session management ────────────────────────────────────────

    static createSession(userId, name, phone) {
        const sessionId = crypto.randomUUID();
        run(
            `INSERT INTO user_sessions (session_id, user_id, name, phone, created_at, last_active)
             VALUES (?, ?, ?, ?, DATETIME('now','localtime'), DATETIME('now','localtime'))`,
            [sessionId, userId, name, phone]
        );
        return sessionId;
    }

    static getSession(sessionId) {
        return get(`SELECT * FROM user_sessions WHERE session_id = ?`, [sessionId]);
    }

    static getSessionsByUser(userId) {
        return all(`SELECT * FROM user_sessions WHERE user_id = ?`, [userId]);
    }

    static deleteSession(sessionId) {
        return run(`DELETE FROM user_sessions WHERE session_id = ?`, [sessionId]);
    }

    static deleteSessionsByUser(userId) {
        return run(`DELETE FROM user_sessions WHERE user_id = ?`, [userId]);
    }

    static touchSession(sessionId) {
        return run(
            `UPDATE user_sessions SET last_active = DATETIME('now','localtime') WHERE session_id = ?`,
            [sessionId]
        );
    }

    static agentNumber(userId, name, phone) {
        try {
            if (!userId || !name) throw new Error('User ID and name are required');
            if (!phone || phone.trim() === '') {
                return { success: false, message: 'Phone number is required' };
            }

            const existingRecord = this.getAgentNumberByUserAndPhone(userId, phone);

            if (existingRecord) {
                run(
                    `UPDATE agentNumbers SET status = 'Active', datetime = DATETIME('now', 'localtime')
                     WHERE id = ? AND phone = ?`,
                    [userId, phone]
                );
                return {
                    success: true,
                    message: 'Phone number activated successfully',
                    reactivated: existingRecord.status !== 'Active'
                };
            }

            const result = run(
                `INSERT INTO agentNumbers (id, name, phone, status, datetime)
                 VALUES (?, ?, ?, 'Active', DATETIME('now', 'localtime'))`,
                [userId, name, phone]
            );
            return {
                success: true,
                message: 'Phone number registered successfully',
                changes: result.changes
            };
        } catch (err) {
            console.error('Agent number error:', err.message);
            return { success: false, message: 'Failed to save phone number', error: err.message };
        }
    }
}

module.exports = AuthModel;