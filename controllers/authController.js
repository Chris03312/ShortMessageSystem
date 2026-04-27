const AuthModel = require('../models/authModel');

class AuthController {
    static async login(req, res) {
        const { userId, password } = req.body;
        console.log('📝 Login attempt for user:', userId);

        if (!userId || !password) {
            return res.status(400).json({ success: false, message: 'User ID and password are required' });
        }

        try {
            const user = await AuthModel.authenticateUser(userId, password);
            if (!user) {
                console.log('❌ Authentication failed for:', userId);
                return res.status(401).json({ success: false, message: 'Invalid credentials or inactive account' });
            }

            AuthModel.setUserStatus(userId, 'Active');
            console.log('✅ Login successful for:', userId);

            const role = userId === 'admin' ? 'admin' : 'user';
            res.json({
                success: true,
                message: 'Login successful',
                user: { user_id: user.id, name: user.name, role, status: 'Active' }
            });
        } catch (err) {
            console.error('❌ Login error:', err.message);
            res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
        }
    }

    static verifyUser(req, res) {
        const { userId, currentPhone } = req.body;
        console.log('📱 Verification attempt for:', userId, 'phone:', currentPhone);

        if (!userId || !currentPhone) {
            return res.status(400).json({ success: false, message: 'User ID and phone number are required' });
        }

        try {
            const user = AuthModel.getUserById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User ID not found' });
            }
            if (user.status !== 'Active') {
                return res.status(401).json({ success: false, message: 'Account is inactive. Please contact administrator.' });
            }

            const sessionId = AuthModel.createSession(userId, user.name, currentPhone);
            console.log('✅ Session created:', sessionId, 'for user:', userId);

            res.json({
                success: true,
                message: 'User verified successfully',
                sessionId,
                user: { user_id: user.id, name: user.name, status: 'Active' }
            });
        } catch (err) {
            console.error('❌ Verification error:', err.message);
            res.status(500).json({ success: false, message: 'Verification failed. Please try again.' });
        }
    }

    static insertUser(req, res) {
        const { userId, name, currentPhone } = req.body;

        if (!userId || !name || !currentPhone) {
            return res.status(400).json({ success: false, message: 'User ID, name, and phone are required' });
        }

        try {
            const result = AuthModel.agentNumber(userId, name, currentPhone);
            if (result.success) {
                console.log('✅ Agent number saved for:', name, '- Phone:', currentPhone);
                res.json({ success: true, message: result.message });
            } else {
                console.log('❌ Failed to save agent number:', result.message);
                res.status(400).json({ success: false, message: result.message });
            }
        } catch (err) {
            console.error('❌ Insert User error:', err.message);
            res.status(500).json({ success: false, message: 'Insert User failed' });
        }
    }

    static cancelSession(req, res) {
        const { sessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({ success: false, message: 'Session ID is required' });
        }

        try {
            const session = AuthModel.getSession(sessionId);
            if (!session) {
                return res.status(404).json({ success: false, message: 'Session not found' });
            }

            AuthModel.deleteSession(sessionId);

            const remainingSessions = AuthModel.getSessionsByUser(session.user_id);
            const phoneStillInUse = remainingSessions.some(s => s.phone === session.phone);

            if (!phoneStillInUse) {
                AuthModel.deactivateAgentNumber(session.user_id);
                console.log(`✅ Agent number deactivated for ${session.user_id} - no remaining sessions`);
            } else {
                console.log(`ℹ️ Agent number kept active for ${session.user_id} - ${remainingSessions.length} tab(s) still open`);
            }

            res.json({ success: true, message: 'Session cancelled successfully' });
        } catch (err) {
            console.error('❌ Cancel session error:', err.message);
            res.status(500).json({ success: false, message: 'Failed to cancel session' });
        }
    }

    static logout(req, res) {
        const { userId } = req.body;
        console.log('🚪 Logout attempt for user:', userId);

        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }

        try {
            AuthModel.deleteSessionsByUser(userId);
            AuthModel.deactivateAgentNumber(userId);
            AuthModel.setUserStatus(userId, 'Inactive');

            console.log('✅ User logged out:', userId);
            res.json({ success: true, message: 'Logged out successfully' });
        } catch (err) {
            console.error('❌ Logout error:', err.message);
            res.status(500).json({ success: false, message: 'Logout failed' });
        }
    }

    static getUserInfo(req, res) {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }
        try {
            const user = AuthModel.getUserById(userId);
            if (!user) return res.status(404).json({ success: false, message: 'User not found' });
            res.json({ success: true, data: user });
        } catch (err) {
            console.error('Get user info error:', err.message);
            res.status(500).json({ success: false, message: 'Failed to get user info' });
        }
    }
}

module.exports = AuthController;