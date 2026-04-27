const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

// Auth routes
router.post('/login', AuthController.login);
router.post('/verify-user', AuthController.verifyUser);
router.post('/insert-user', AuthController.insertUser);
router.post('/cancel-session', AuthController.cancelSession);   // per-tab cancel
router.post('/logout', AuthController.logout);
router.get('/user/:userId', AuthController.getUserInfo);

module.exports = router;