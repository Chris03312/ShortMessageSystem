const { all, get, run } = require('../databases/db');

class SmsModel {
    static addToQueue(phone, message, gatewayUrl, gatewayToken) {
        const result = run(
            `INSERT INTO sms_queue (phone, message, status, gatewayUrl, gatewayToken)
             VALUES (?, ?, 'pending', ?, ?)`,
            [phone, message, gatewayUrl, gatewayToken]
        );
        console.log(`📥 Queued message for ${phone} — id: ${result.lastInsertRowid}`);
        return result;
    }

    static getPendingBatch(limit = 5) {
        return all(
            `SELECT * FROM sms_queue WHERE status = 'pending' ORDER BY id ASC LIMIT ?`,
            [limit]
        );
    }

    static markAsProcessing(id) {
        return run(
            `UPDATE sms_queue SET status = 'processing' WHERE id = ? AND status = 'pending'`,
            [id]
        );
    }

    static deleteMessage(id) {
        return run(`DELETE FROM sms_queue WHERE id = ?`, [id]);
    }

    static updateMessageStatus(status, id) {
        return run(`UPDATE sms_queue SET status = ? WHERE id = ?`, [status, id]);
    }

    static getQueuedByToken(token) {
        return all(`SELECT * FROM sms_queue WHERE gatewayToken = ?`, [token]);
    }

    static deleteQueuedByToken(token) {
        const result = run(`DELETE FROM sms_queue WHERE gatewayToken = ?`, [token]);
        console.log(`🗑️ Deleted ${result.changes} queued message(s) by token`);
        return result;
    }

    static updateGatewayUrl(gatewayUrl, token) {
        const result = run(
            `UPDATE sms_queue SET gatewayUrl = ? WHERE gatewayToken = ?`,
            [gatewayUrl, token]
        );
        console.log(`🔄 Updated gateway URL for ${result.changes} queued message(s)`);
        return result;
    }

    static addUser(id, name, phone) {
        return run(
            `INSERT INTO agentNumbers (id, name, phone, status, datetime)
             VALUES (?, ?, ?, 'Active', DATETIME('now', 'localtime'))`,
            [id, name, phone]
        );
    }

    static deactivateUser(id) {
        const result = run(
            `UPDATE agentNumbers SET status = 'Inactive', datetime = DATETIME('now', 'localtime') WHERE id = ?`,
            [id]
        );
        console.log(`❌ Deactivated user ${id} — changes: ${result.changes}`);
        return result;
    }
}

module.exports = SmsModel;