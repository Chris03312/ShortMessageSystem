const axios = require('axios');
const SmsModel = require('../models/smsModel');
const { delay, logSentNumber, logFailedNumber } = require('../utils/helpers');

const sendController = { canceled: false };

// ========== HELPER FUNCTIONS ==========

function formatPhoneNumber(phone) {
    let cleaned = phone.replace(/\D/g, '');

    if (cleaned.startsWith('09')) {
        cleaned = '+63' + cleaned.substring(1);
    } else if (cleaned.startsWith('9') && cleaned.length === 10) {
        cleaned = '+63' + cleaned;
    } else if (cleaned.startsWith('63')) {
        cleaned = '+' + cleaned;
    } else if (!cleaned.startsWith('+')) {
        cleaned = '+63' + cleaned;
    }

    return cleaned;
}

// ========== SEND SMS FUNCTION ==========

async function sendSMS(phone, message, gatewayUrl, gatewayToken) {
    const formattedPhone = formatPhoneNumber(phone);

    try {
        const response = await axios.post(
            gatewayUrl,
            { to: formattedPhone, message },
            {
                headers: {
                    Authorization: gatewayToken,
                    'Content-Type': 'application/json'
                },
                timeout: 5000,
            }
        );

        const data = response.data;

        if (response.status === 200) {
            if (data === "" || data === null || data === undefined) {
                return { success: true };
            }

            if (typeof data === 'object') {
                if (data.success === false || data.error) {
                    throw new Error(data.error || data.message || 'Send failed');
                }

                if (data.status === 'failed' ||
                    (data.message && typeof data.message === 'string' && data.message.toLowerCase().includes('insufficient'))) {
                    throw new Error(data.error || data.message || 'Send failed');
                }
            }

            return data;
        }

        throw new Error(`Gateway returned status ${response.status}`);

    } catch (err) {
        if (err.response) {
            console.error(`❌ Gateway error [${err.response.status}] for ${formattedPhone}:`, err.response.data);
            throw new Error(err.response.data?.error || err.response.data?.message || 'Gateway error');
        } else if (err.request) {
            console.error(`❌ No response from gateway for ${formattedPhone}`);
            throw new Error('No response from gateway - check connection');
        } else {
            throw new Error(err.message);
        }
    }
}

// ========== SMS CONTROLLER CLASS ==========

class SmsController {
    static async checkGateway(req, res) {
        const { gatewayUrl, gatewayToken, confirmResend } = req.body;

        if (!gatewayUrl || !gatewayToken) {
            return res.status(400).json({ success: false, message: 'Missing gateway URL or token' });
        }

        try {
            const baseUrl = gatewayUrl.replace(/\/+$/, '');

            const response = await axios.get(`${baseUrl}/health`, {
                headers: { 'Content-Type': 'application/json', 'Authorization': gatewayToken.trim() },
                timeout: 6000, validateStatus: s => s < 500,
            });

            if (response.data?.error?.toLowerCase().includes('unauthorized')) {
                return res.status(401).json({ success: false, message: '❌ Invalid token' });
            }

            if (response.data?.success === false) {
                const errorMsg = response.data?.error || response.data?.message || 'Gateway error';
                return res.status(500).json({ success: false, message: `❌ ${errorMsg}` });
            }

            console.log(`✅ Gateway reachable: ${baseUrl}`);

            const queued = SmsModel.getQueuedByToken(gatewayToken);

            if (queued.length > 0) {
                if (confirmResend === true) {
                    const r = SmsModel.updateGatewayUrl(gatewayUrl, gatewayToken);
                    return res.json({ success: true, message: `✅ Updated ${r.changes} queued message(s).` });
                }
                if (confirmResend === false) {
                    const d = SmsModel.deleteQueuedByToken(gatewayToken);
                    return res.json({ success: true, message: `🗑️ Deleted ${d.changes} queued message(s).` });
                }
                return res.json({
                    success: true,
                    needsConfirmation: true,
                    queuedCount: queued.length,
                    message: `⚠️ Found ${queued.length} queued message(s).`,
                });
            }

            return res.json({ success: true, message: '✅ Gateway is valid.' });

        } catch (err) {
            let errorMessage = err.message;
            if (err.code === 'ECONNREFUSED') errorMessage = 'Cannot reach gateway';
            else if (err.code === 'ETIMEDOUT') errorMessage = 'Gateway timed out';

            console.error('❌ checkGateway error:', errorMessage);
            return res.status(500).json({ success: false, message: `❌ ${errorMessage}` });
        }
    }

    static async sendSms(req, res) {
        const { phone, message, gatewayUrl, gatewayToken, delayMs = 4000, name, number } = req.body;

        sendController.canceled = false;

        const phones = phone.split(';').map(p => p.trim()).filter(p => p);
        console.log(`📨 Batch send started — ${phones.length} number(s)`);

        const results = [];

        for (let i = 0; i < phones.length; i++) {
            const p = phones[i];

            if (sendController.canceled) {
                results.push({ phone: p, status: 'canceled' });
                continue;
            }

            try {
                if (i !== 0) await delay(delayMs);

                await sendSMS(p, message, gatewayUrl, gatewayToken);
                logSentNumber(name, p, number);
                console.log(`✅ Sent to ${p}`);
                results.push({ phone: p, status: 'sent' });

            } catch (err) {
                console.error(`❌ Failed to send to ${p}: ${err.message}`);
                logFailedNumber(name, p, err.message);
                SmsModel.addToQueue(p, message, gatewayUrl, gatewayToken);
                results.push({ phone: p, status: 'failed', error: err.message });
            }
        }

        console.log(`📨 Batch complete — Results: ${JSON.stringify(results.map(r => ({ phone: r.phone, status: r.status })))}`);
        res.json(results);
    }

    static cancelSending(req, res) {
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({ success: false, message: 'Missing user ID.' });
        }

        if (!sendController.canceled) {
            try {
                const result = SmsModel.deactivateUser(user_id);
                if (!result || result.changes === 0) {
                    return res.status(404).json({ success: false, message: 'User not found.' });
                }

                sendController.canceled = true;
                console.log(`🛑 Sending canceled for user: ${user_id}`);
                return res.json({ success: true, message: 'Sending canceled.' });

            } catch (err) {
                console.error('❌ DB Error during cancel:', err.message);
                return res.status(500).json({ success: false, message: 'Database error.' });
            }
        } else {
            return res.json({ success: false, message: 'Already canceled.' });
        }
    }

    static getStatus(req, res) {
        res.json({
            canceled: sendController.canceled,
            message: sendController.canceled ? 'Sending is canceled.' : 'Sending is active.',
        });
    }
}

module.exports = { SmsController, sendController, sendSMS };