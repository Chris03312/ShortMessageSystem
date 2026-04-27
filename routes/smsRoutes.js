const express = require('express');
const router = express.Router();
const { SmsController } = require('../controllers/smsController');

// SMS routes
router.post('/check-gateway', SmsController.checkGateway);
router.post('/send-sms', SmsController.sendSms);
router.post('/cancel-sms', SmsController.cancelSending);
router.get('/status', SmsController.getStatus);

module.exports = router;