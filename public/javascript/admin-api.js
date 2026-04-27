// Admin API Service
const AdminApiService = {
    async getDashboardStats() {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/admin/stats`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            return { success: false, message: 'Failed to fetch stats' };
        }
    },

    async getUsers(page = 1, limit = 10) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/admin/users?page=${page}&limit=${limit}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching users:', error);
            return { success: false, message: 'Failed to fetch users' };
        }
    },

    async getUserDetails(userId) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/admin/users/${userId}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching user details:', error);
            return { success: false, message: 'Failed to fetch user details' };
        }
    },

    async addUser(userData) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/admin/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            return await response.json();
        } catch (error) {
            console.error('Error adding user:', error);
            return { success: false, message: 'Failed to add user' };
        }
    },

    async deactivateUser(userId) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/admin/users/${userId}/deactivate`, {
                method: 'PUT'
            });
            return await response.json();
        } catch (error) {
            console.error('Error deactivating user:', error);
            return { success: false, message: 'Failed to deactivate user' };
        }
    },

    async activateUser(userId) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/admin/users/${userId}/activate`, {
                method: 'PUT'
            });
            return await response.json();
        } catch (error) {
            console.error('Error activating user:', error);
            return { success: false, message: 'Failed to activate user' };
        }
    },

    async getUserLogs(userId = null, date = null, page = 1, limit = 15) {
        try {
            let url = `${API_CONFIG.BASE_URL}/admin/logs`;
            const params = new URLSearchParams();
            if (userId) params.append('userId', userId);
            if (date) params.append('date', date);
            params.append('page', page);
            params.append('limit', limit);
            url += `?${params.toString()}`;
            const response = await fetch(url);
            return await response.json();
        } catch (error) {
            console.error('Error fetching logs:', error);
            return { success: false, message: 'Failed to fetch logs' };
        }
    },

    async getPhoneNumbers(filter = 'all', page = 1, limit = 10) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/admin/numbers?filter=${filter}&page=${page}&limit=${limit}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching phone numbers:', error);
            return { success: false, message: 'Failed to fetch phone numbers' };
        }
    },

    async deletePhoneNumber(phone) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/admin/numbers/${encodeURIComponent(phone)}`, {
                method: 'DELETE'
            });
            return await response.json();
        } catch (error) {
            console.error('Error deleting phone number:', error);
            return { success: false, message: 'Failed to delete phone number' };
        }
    },

    async updatePhoneNumberStatus(phone, status) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/admin/numbers/${encodeURIComponent(phone)}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            return await response.json();
        } catch (error) {
            console.error('Error updating phone number status:', error);
            return { success: false, message: 'Failed to update phone number status' };
        }
    },

    async blacklistPhoneNumber(phone) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/admin/numbers/blacklist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone })
            });
            return await response.json();
        } catch (error) {
            console.error('Error blacklisting phone number:', error);
            return { success: false, message: 'Failed to blacklist phone number' };
        }
    },

    async getRecentActivity(limit = 20) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/admin/activity?limit=${limit}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching recent activity:', error);
            return { success: false, message: 'Failed to fetch recent activity' };
        }
    }
};

// deleteUser — appended separately
AdminApiService.deleteUser = async function (userId) {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/admin/users/${userId}`, { method: 'DELETE' });
        return await response.json();
    } catch (error) {
        console.error('Error deleting user:', error);
        return { success: false, message: 'Failed to delete user' };
    }
};
