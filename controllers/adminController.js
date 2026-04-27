const AdminModel = require('../models/adminModel');
const bcrypt = require('bcryptjs');

class AdminController {
    static getDashboardStats(req, res) {
        try {
            const stats = AdminModel.getDashboardStats();
            res.json({ success: true, data: stats });
        } catch (err) {
            console.error('Error getting dashboard stats:', err.message);
            res.status(500).json({ success: false, message: 'Failed to get statistics' });
        }
    }

    static getUsers(req, res) {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
        try {
            const result = AdminModel.getAllUsers(page, limit);
            res.json({ success: true, data: result.data, pagination: result.pagination });
        } catch (err) {
            console.error('Error getting users:', err.message);
            res.status(500).json({ success: false, message: 'Failed to get users' });
        }
    }

    static getUserDetails(req, res) {
        const { userId } = req.params;
        try {
            const user = AdminModel.getUserById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            res.json({ success: true, data: user });
        } catch (err) {
            console.error('Error getting user details:', err.message);
            res.status(500).json({ success: false, message: 'Failed to get user details' });
        }
    }

    static async addUser(req, res) {
        const { userId, name, password } = req.body;

        if (!userId || !name || !password) {
            return res.status(400).json({
                success: false,
                message: 'User ID, name, and password are required'
            });
        }

        if (userId.trim().length < 3) {
            return res.status(400).json({ success: false, message: 'User ID must be at least 3 characters' });
        }
        if (password.length < 3) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        try {
            const existingUser = AdminModel.getUserByUsername(userId.trim());
            if (existingUser) {
                return res.status(409).json({ success: false, message: 'Username already exists' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            AdminModel.createUser({
                userId: userId.trim(),
                name: name.trim(),
                password: hashedPassword,
                status: 'Inactive'
            });

            res.status(201).json({ success: true, message: 'User added successfully' });
        } catch (err) {
            console.error('Error adding user:', err.message);
            res.status(500).json({ success: false, message: 'Failed to add user' });
        }
    }

    static deactivateUser(req, res) {
        const { userId } = req.params;
        try {
            const result = AdminModel.deactivateUser(userId);
            if (!result || result.changes === 0) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            res.json({ success: true, message: 'User deactivated successfully' });
        } catch (err) {
            console.error('Error deactivating user:', err.message);
            res.status(500).json({ success: false, message: 'Failed to deactivate user' });
        }
    }

    static deleteUser(req, res) {
        const { userId } = req.params;

        if (userId === 'admin') {
            return res.status(403).json({ success: false, message: 'Cannot delete the admin account' });
        }

        try {
            const result = AdminModel.deleteUser(userId);
            if (!result || result.changes === 0) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            res.json({ success: true, message: 'User deleted successfully' });
        } catch (err) {
            console.error('Error deleting user:', err.message);
            res.status(500).json({ success: false, message: 'Failed to delete user' });
        }
    }

    static activateUser(req, res) {
        const { userId } = req.params;
        try {
            const result = AdminModel.activateUser(userId);
            if (!result || result.changes === 0) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            res.json({ success: true, message: 'User activated successfully' });
        } catch (err) {
            console.error('Error activating user:', err.message);
            res.status(500).json({ success: false, message: 'Failed to activate user' });
        }
    }

    static getUserLogs(req, res) {
        const { userId, date } = req.query;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 15));
        try {
            const result = AdminModel.getUserLogs(userId, date, page, limit);
            res.json({ success: true, data: result.data, pagination: result.pagination });
        } catch (err) {
            console.error('Error getting logs:', err.message);
            res.status(500).json({ success: false, message: 'Failed to get logs' });
        }
    }

    static getPhoneNumbers(req, res) {
        const { filter } = req.query;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
        try {
            const result = AdminModel.getAllPhoneNumbers(filter, page, limit);
            res.json({ success: true, data: result.data, pagination: result.pagination });
        } catch (err) {
            console.error('Error getting phone numbers:', err.message);
            res.status(500).json({ success: false, message: 'Failed to get phone numbers' });
        }
    }

    static deletePhoneNumber(req, res) {
        const { phone } = req.params;
        try {
            const result = AdminModel.deletePhoneNumber(phone);
            if (!result || result.changes === 0) {
                return res.status(404).json({ success: false, message: 'Phone number not found' });
            }
            res.json({ success: true, message: 'Phone number deleted successfully' });
        } catch (err) {
            console.error('Error deleting phone number:', err.message);
            res.status(500).json({ success: false, message: 'Failed to delete phone number' });
        }
    }

    static updatePhoneNumberStatus(req, res) {
        const { phone } = req.params;
        const { status } = req.body;

        const validStatuses = ['Active', 'Inactive'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Status must be one of: ${validStatuses.join(', ')}`
            });
        }

        try {
            const result = AdminModel.updateAgentNumberStatus(phone, status);
            if (!result || result.changes === 0) {
                return res.status(404).json({ success: false, message: 'Phone number not found' });
            }
            res.json({ success: true, message: `Phone number status updated to ${status}` });
        } catch (err) {
            console.error('Error updating phone number status:', err.message);
            res.status(500).json({ success: false, message: 'Failed to update phone number status' });
        }
    }

    static blacklistPhoneNumber(req, res) {
        const { phone } = req.body;
        if (!phone) {
            return res.status(400).json({ success: false, message: 'Phone number is required' });
        }
        try {
            AdminModel.blacklistPhoneNumber(phone);
            res.json({ success: true, message: 'Phone number blacklisted successfully' });
        } catch (err) {
            console.error('Error blacklisting phone number:', err.message);
            res.status(500).json({ success: false, message: 'Failed to blacklist phone number' });
        }
    }

    static getRecentActivity(req, res) {
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        try {
            const activity = AdminModel.getRecentActivity(limit);
            res.json({ success: true, data: activity });
        } catch (err) {
            console.error('Error getting recent activity:', err.message);
            res.status(500).json({ success: false, message: 'Failed to get recent activity' });
        }
    }
}

module.exports = AdminController;