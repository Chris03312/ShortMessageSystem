const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');

// User routes
router.post('/users', UserController.addUser);
router.post('/countSentLogs', UserController.countSentLogs);

module.exports = router;