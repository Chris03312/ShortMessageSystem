const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');

// Dashboard
router.get('/stats', AdminController.getDashboardStats);
router.get('/activity', AdminController.getRecentActivity);

// Users
router.get('/users', AdminController.getUsers);
router.post('/users', AdminController.addUser);
router.get('/users/:userId', AdminController.getUserDetails);
router.put('/users/:userId/deactivate', AdminController.deactivateUser);
router.put('/users/:userId/activate', AdminController.activateUser);
router.delete('/users/:userId', AdminController.deleteUser);

// Logs
router.get('/logs', AdminController.getUserLogs);

// Phone numbers
router.get('/numbers', AdminController.getPhoneNumbers);
router.put('/numbers/:phone/status', AdminController.updatePhoneNumberStatus);
router.delete('/numbers/:phone', AdminController.deletePhoneNumber);
router.post('/numbers/blacklist', AdminController.blacklistPhoneNumber);

module.exports = router;
