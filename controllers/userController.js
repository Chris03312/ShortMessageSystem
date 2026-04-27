const SmsModel = require('../models/smsModel');
const { countSentLogs } = require('../utils/helpers');

class UserController {
    static addUser(req, res) {
        const { id, name, phone } = req.body;

        try {
            SmsModel.addUser(id, name, phone);
            console.log(`✅ User session added: ${name}`);
            res.json({ success: true, message: 'User added successfully' });
        } catch (err) {
            console.error(`❌ Failed to insert user:`, err.message);

            // sql.js throws "UNIQUE constraint failed: ..." (same wording as better-sqlite3)
            if (err.message && err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({
                    success: false,
                    message: '⚠️ This ID or phone number is already in use.'
                });
            }

            res.status(500).json({ success: false, message: 'Failed to add user' });
        }
    }

    static countSentLogs(req, res) {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Missing user name.' });
        }

        try {
            const count = countSentLogs(name);
            res.json({ success: true, count });
        } catch (err) {
            console.error('❌ Error in countSentLogs:', err.message);
            return res.status(500).json({ success: false, message: 'Error reading log file.' });
        }
    }
}

module.exports = UserController;