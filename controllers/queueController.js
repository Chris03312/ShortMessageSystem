const SmsModel = require('../models/smsModel');
const { sendSMS, sendController } = require('./smsController');
const { delay, logQueueRetryFailed } = require('../utils/helpers');

let isProcessing = false;

/**
 * Fetch and lock a batch of pending messages
 */
function fetchAndLockBatch(limit = 5) {
    const pending = SmsModel.getPendingBatch(limit);
    const locked = [];

    for (const msg of pending) {
        const result = SmsModel.markAsProcessing(msg.id);
        if (result && result.changes === 1) {
            locked.push(msg);
        }
    }

    return locked;
}

/**
 * Process a batch of queued messages
 */
async function processQueue() {
    if (isProcessing) return;

    isProcessing = true;

    try {
        const batch = fetchAndLockBatch(5);

        if (batch.length === 0) return;

        console.log(`📤 Processing queue batch: ${batch.length} messages`);

        for (let i = 0; i < batch.length; i++) {
            const msg = batch[i];

            if (sendController.canceled) {
                SmsModel.updateMessageStatus('pending', msg.id);
                continue;
            }

            try {
                if (i !== 0) await delay(4000);

                await sendSMS(msg.phone, msg.message, msg.gatewayUrl, msg.gatewayToken);
                SmsModel.deleteMessage(msg.id);
                console.log(`✅ Queued SMS sent to ${msg.phone}`);

            } catch (err) {
                SmsModel.updateMessageStatus('pending', msg.id);
                logQueueRetryFailed(msg.phone, err.message);
                console.error(`❌ Retry failed for ${msg.phone}: ${err.message}`);
            }
        }
    } catch (err) {
        console.error('Queue processing error:', err.message);
    } finally {
        isProcessing = false;
    }
}

/**
 * Queue worker - runs continuously
 */
async function queueWorker() {
    console.log('🔄 Queue worker started');

    while (true) {
        try {
            await processQueue();
        } catch (err) {
            console.error('Queue worker error:', err.message);
        }
        await delay(10000);
    }
}

/**
 * Start the queue worker
 */
function startWorker() {
    queueWorker().catch(err => {
        console.error('Fatal queue worker error:', err);
        setTimeout(() => startWorker(), 30000);
    });
}

module.exports = { startWorker, processQueue };