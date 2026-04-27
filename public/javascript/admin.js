// Admin Dashboard - Updated for new UI
const AdminDashboard = {
    currentTab: 'overview',
    refreshInterval: null,

    pagination: {
        users: { page: 1, limit: 10, total: 0, totalPages: 1 },
        logs: { page: 1, limit: 15, total: 0, totalPages: 1 },
        numbers: { page: 1, limit: 10, total: 0, totalPages: 1 }
    },

    allNumbers: [],
    allUsers: [],  // Store all users for client-side filtering

    async init() {
        // Wait for config to load from server
        await waitForConfig();

        this.checkAuth();
        this.setupEventListeners();
        this.loadDashboardData();
        this.startAutoRefresh();
    },

    checkAuth() {
        const user = sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        if (!user) { window.location.href = '/'; return; }
        const userData = JSON.parse(user);
        if (userData.role !== 'admin') {
            alert('Access denied. Admin only.');
            window.location.href = '/login.html';
            return;
        }
        document.getElementById('adminName').textContent = userData.name || 'Administrator';
    },

    setupEventListeners() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(item.dataset.tab);
            });
        });
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        document.getElementById('refreshBtn').addEventListener('click', () => this.loadDashboardData());

        // Users tab filters
        document.getElementById('searchUser')?.addEventListener('input', (e) => this.searchUsers(e.target.value));
        document.getElementById('userStatusFilter')?.addEventListener('change', () => this.filterUsers());

        // Logs tab filters
        document.getElementById('logFilter')?.addEventListener('change', () => { this.pagination.logs.page = 1; this.loadLogs(); });
        document.getElementById('logDate')?.addEventListener('change', () => { this.pagination.logs.page = 1; this.loadLogs(); });
        document.getElementById('numberFilter')?.addEventListener('change', () => { this.pagination.numbers.page = 1; this.loadPhoneNumbers(); });
        document.getElementById('searchNumber')?.addEventListener('input', (e) => this.searchNumbers(e.target.value));
        document.getElementById('addUserForm')?.addEventListener('submit', (e) => { e.preventDefault(); this.addUser(); });

        document.getElementById('modalConfirmBtn').addEventListener('click', () => this.executeModalAction());
        document.getElementById('modalCancelBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('confirmModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('confirmModal')) this.closeModal();
        });
    },

    // ─── Modal ──────────────────────────────────────────────
    _pendingAction: null,

    showModal({ title, message, confirmLabel, confirmClass, onConfirm }) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalMessage').textContent = message;
        const btn = document.getElementById('modalConfirmBtn');
        btn.textContent = confirmLabel || 'Confirm';
        btn.className = 'btn ' + (confirmClass || 'btn-danger');
        this._pendingAction = onConfirm;
        document.getElementById('confirmModal').classList.add('active');
    },

    closeModal() {
        document.getElementById('confirmModal').classList.remove('active');
        this._pendingAction = null;
    },

    executeModalAction() {
        if (this._pendingAction) this._pendingAction();
        this.closeModal();
    },

    // ─── Toast ──────────────────────────────────────────────
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast toast-${type} show`;
        setTimeout(() => toast.classList.remove('show'), 3000);
    },

    // ─── Tab Switching ───────────────────────────────────────
    switchTab(tabName) {
        // Update nav items
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Note: No pageTitle element in new design - title is in page-header within each tab
        this.currentTab = tabName;
        this.loadTabData(tabName);
    },

    async loadDashboardData() { await this.loadTabData(this.currentTab); },

    async loadTabData(tabName) {
        switch (tabName) {
            case 'overview': await this.loadOverview(); break;
            case 'users': await this.loadUsers(); break;
            case 'logs': await this.loadLogs(); break;
            case 'numbers': await this.loadPhoneNumbers(); break;
        }
    },

    // ─── Overview ────────────────────────────────────────────
    async loadOverview() {
        try {
            const stats = await AdminApiService.getDashboardStats();
            if (stats.success) {
                this.updateStatValue('totalUsers', stats.data.totalUsers || 0);
                this.updateStatValue('totalSent', stats.data.totalSent || 0);
                this.updateStatValue('totalFailed', stats.data.totalFailed || 0);
                this.updateStatValue('totalQueued', stats.data.totalQueued || 0);
            }
            const activity = await AdminApiService.getRecentActivity(20);
            if (activity.success) this.renderRecentActivity(activity.data);
        } catch (error) { console.error('Error loading overview:', error); }
    },

    updateStatValue(id, value) {
        const element = document.getElementById(id);
        if (element) {
            const currentValue = parseInt(element.textContent) || 0;
            if (currentValue !== value) {
                element.textContent = value;
                element.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    element.style.transform = 'scale(1)';
                }, 200);
            }
        }
    },

    renderRecentActivity(activities) {
        const container = document.getElementById('recentActivity');
        if (!activities || activities.length === 0) {
            container.innerHTML = '<div class="activity-loading">No recent activity</div>';
            return;
        }
        container.innerHTML = activities.map(a => `
            <div class="activity-item">
                <div class="time">${this.formatDateTime(a.timestamp)}</div>
                <div class="details">
                    <strong>${a.userName}</strong> ${a.action}
                    ${a.phone ? `to ${a.phone}` : ''}
                    ${a.status ? `- <span class="badge badge-${this.getStatusClass(a.status)}">${a.status}</span>` : ''}
                </div>
            </div>`).join('');
    },

    // ─── Users ───────────────────────────────────────────────
    async loadUsers() {
        try {
            const { page, limit } = this.pagination.users;
            const result = await AdminApiService.getUsers(page, limit);
            if (result.success) {
                this.allUsers = result.data; // Store for filtering
                this.pagination.users = { ...this.pagination.users, ...result.pagination };
                this.renderUsersTable(result.data);
                this.renderPagination('users-pagination', this.pagination.users, (p) => {
                    this.pagination.users.page = p; this.loadUsers();
                });
            }
        } catch (error) { console.error('Error loading users:', error); }
    },

    searchUsers(query) {
        if (!this.allUsers) return;

        const searchTerm = query.toLowerCase().trim();
        const statusFilter = document.getElementById('userStatusFilter')?.value || 'all';

        let filtered = this.allUsers;

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(user =>
                user.id.toLowerCase().includes(searchTerm) ||
                user.name.toLowerCase().includes(searchTerm) ||
                (user.phone && user.phone.includes(searchTerm))
            );
        }

        // Apply status filter
        if (statusFilter === 'active') {
            filtered = filtered.filter(user => user.status === 'Active');
        } else if (statusFilter === 'inactive') {
            filtered = filtered.filter(user => user.status !== 'Active');
        }

        this.renderUsersTable(filtered);

        // Update pagination info to show filtered results
        const container = document.getElementById('users-pagination');
        if (container) {
            if (filtered.length === this.allUsers.length) {
                // Show normal pagination if not filtered
                this.renderPagination('users-pagination', this.pagination.users, (p) => {
                    this.pagination.users.page = p; this.loadUsers();
                });
            } else {
                // Show filtered count
                container.innerHTML = `<div class="pagination-info">Showing ${filtered.length} of ${this.allUsers.length} users</div>`;
            }
        }
    },

    filterUsers() {
        const searchInput = document.getElementById('searchUser');
        this.searchUsers(searchInput ? searchInput.value : '');
    },

    renderUsersTable(users) {
        const tbody = document.getElementById('usersTableBody');
        if (!users || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="table-loading">No users found</td></tr>';
            return;
        }
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.phone || 'N/A'}</td>
                <td><span class="badge badge-${user.status === 'Active' ? 'success' : 'danger'}">${user.status}</span></td>
                <td>${user.sentToday || 0}</td>
                <td>${this.formatDateTime(user.lastActive)}</td>
                <td class="action-btns">
                    <button class="btn btn-sm btn-primary" onclick="AdminDashboard.viewUserDetails('${user.id}')">View</button>
                    ${user.status === 'Active'
                ? `<button class="btn btn-sm btn-warning" onclick="AdminDashboard.confirmDeactivateUser('${user.id}', '${user.name}')">Deactivate</button>`
                : `<button class="btn btn-sm btn-success" onclick="AdminDashboard.confirmActivateUser('${user.id}', '${user.name}')">Activate</button>`
            }
                    ${user.id !== 'admin' ? `<button class="btn btn-sm btn-danger" onclick="AdminDashboard.confirmDeleteUser('${user.id}', '${user.name}')">Delete</button>` : ''}
                </td>
            </tr>`).join('');
    },

    confirmDeactivateUser(userId, userName) {
        this.showModal({
            title: 'Deactivate User',
            message: `Are you sure you want to deactivate "${userName}"? Their phone number will also be deactivated.`,
            confirmLabel: 'Deactivate',
            confirmClass: 'btn-warning',
            onConfirm: () => this.deactivateUser(userId)
        });
    },

    confirmActivateUser(userId, userName) {
        this.showModal({
            title: 'Activate User',
            message: `Activate "${userName}"? Their phone number will also be re-activated.`,
            confirmLabel: 'Activate',
            confirmClass: 'btn-success',
            onConfirm: () => this.activateUser(userId)
        });
    },

    confirmDeleteUser(userId, userName) {
        this.showModal({
            title: 'Delete User',
            message: `Permanently delete "${userName}"? This cannot be undone.`,
            confirmLabel: 'Delete',
            confirmClass: 'btn-danger',
            onConfirm: () => this.deleteUser(userId)
        });
    },

    async deactivateUser(userId) {
        try {
            const result = await AdminApiService.deactivateUser(userId);
            if (result.success) { this.showToast('User deactivated successfully'); this.loadUsers(); }
            else this.showToast(result.message || 'Failed to deactivate user', 'error');
        } catch (error) { this.showToast('Error deactivating user', 'error'); }
    },

    async activateUser(userId) {
        try {
            const result = await AdminApiService.activateUser(userId);
            if (result.success) { this.showToast('User activated successfully'); this.loadUsers(); }
            else this.showToast(result.message || 'Failed to activate user', 'error');
        } catch (error) { this.showToast('Error activating user', 'error'); }
    },

    async deleteUser(userId) {
        try {
            const result = await AdminApiService.deleteUser ? await AdminApiService.deleteUser(userId) : { success: false };
            if (result && result.success) { this.showToast('User deleted successfully'); this.loadUsers(); }
            else this.showToast(result.message || 'Failed to delete user', 'error');
        } catch (error) { this.showToast('Error deleting user', 'error'); }
    },

    async viewUserDetails(userId) {
        try {
            const result = await AdminApiService.getUserDetails(userId);
            if (result.success) {
                const d = result.data;
                this.showModal({
                    title: `👤 User: ${d.name}`,
                    message: `Status: ${d.status}\nSent Today: ${d.sentToday}\nTotal Sent: ${d.totalSent}`,
                    confirmLabel: 'Close',
                    confirmClass: 'btn-primary',
                    onConfirm: () => { }
                });
            }
        } catch (error) { this.showToast('Error loading user details', 'error'); }
    },

    // ─── Logs ────────────────────────────────────────────────
    async loadLogs() {
        try {
            const filter = document.getElementById('logFilter')?.value;
            const date = document.getElementById('logDate')?.value;
            const { page, limit } = this.pagination.logs;
            const result = await AdminApiService.getUserLogs(null, date, page, limit);
            if (result.success) {
                this.pagination.logs = { ...this.pagination.logs, ...result.pagination };
                this.renderLogsTable(result.data, filter);
                this.renderPagination('logs-pagination', this.pagination.logs, (p) => {
                    this.pagination.logs.page = p; this.loadLogs();
                });
            }
        } catch (error) { console.error('Error loading logs:', error); }
    },

    renderLogsTable(logs, filter) {
        const tbody = document.getElementById('logsTableBody');
        if (!logs || logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="table-loading">No logs found</td></tr>';
            return;
        }
        let filtered = logs;
        if (filter === 'sent') filtered = logs.filter(l => l.status === 'sent');
        if (filter === 'failed') filtered = logs.filter(l => l.status === 'failed');
        tbody.innerHTML = filtered.map(log => `
            <tr>
                <td>${this.formatDateTime(log.timestamp)}</td>
                <td>${log.userName}</td>
                <td>${log.phone}</td>
                <td><span class="badge badge-${this.getStatusClass(log.status)}">${log.status}</span></td>
                <td>${log.gateway || 'N/A'}</td>
                <td>${log.details || '-'}</td>
            </tr>`).join('');
    },

    // ─── Phone Numbers ───────────────────────────────────────
    async loadPhoneNumbers() {
        try {
            const filter = document.getElementById('numberFilter')?.value || 'all';
            const { page, limit } = this.pagination.numbers;
            const result = await AdminApiService.getPhoneNumbers(filter, page, limit);
            if (result.success) {
                this.allNumbers = result.data;
                this.pagination.numbers = { ...this.pagination.numbers, ...result.pagination };
                this.renderNumbersTable(result.data);
                this.renderPagination('numbers-pagination', this.pagination.numbers, (p) => {
                    this.pagination.numbers.page = p; this.loadPhoneNumbers();
                });
            }
        } catch (error) { console.error('Error loading phone numbers:', error); }
    },

    renderNumbersTable(numbers) {
        const tbody = document.getElementById('numbersTableBody');
        if (!numbers || numbers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="table-loading">No phone numbers found</td></tr>';
            return;
        }
        tbody.innerHTML = numbers.map(num => `
            <tr>
                <td>${num.phone}</td>
                <td>${num.userName || 'N/A'}</td>
                <td><span class="badge badge-${num.status === 'Active' ? 'success' : 'danger'}">${num.status === 'Active' ? 'Active' : 'Inactive'}</span></td>
                <td class="action-btns">
                    ${num.status === 'Active'
                ? `<button class="btn btn-sm btn-warning" onclick="AdminDashboard.confirmUpdateNumberStatus('${num.phone}', 'Inactive')">Deactivate</button>`
                : `<button class="btn btn-sm btn-success" onclick="AdminDashboard.confirmUpdateNumberStatus('${num.phone}', 'Active')">Activate</button>`
            }
                    <button class="btn btn-sm btn-danger" onclick="AdminDashboard.confirmDeleteNumber('${num.phone}')">Delete</button>
                </td>
            </tr>`).join('');
    },

    searchNumbers(query) {
        if (!this.allNumbers) return;
        const filtered = this.allNumbers.filter(n =>
            n.phone.includes(query) || (n.userName && n.userName.toLowerCase().includes(query.toLowerCase()))
        );
        this.renderNumbersTable(filtered);
    },

    confirmUpdateNumberStatus(phone, newStatus) {
        const action = newStatus === 'Inactive' ? 'Deactivate' : 'Activate';
        this.showModal({
            title: `${action} Number`,
            message: `${action} the number ${phone}?`,
            confirmLabel: action,
            confirmClass: newStatus === 'Inactive' ? 'btn-warning' : 'btn-success',
            onConfirm: () => this.updateAgentNumberStatus(phone, newStatus)
        });
    },

    confirmDeleteNumber(phone) {
        this.showModal({
            title: 'Delete Number',
            message: `Permanently delete number ${phone}? This cannot be undone.`,
            confirmLabel: 'Delete',
            confirmClass: 'btn-danger',
            onConfirm: () => this.deleteNumber(phone)
        });
    },

    async deleteNumber(phone) {
        try {
            const result = await AdminApiService.deletePhoneNumber(phone);
            if (result.success) { this.showToast('Number deleted'); this.loadPhoneNumbers(); }
            else this.showToast(result.message || 'Failed to delete number', 'error');
        } catch (error) { this.showToast('Error deleting number', 'error'); }
    },

    async updateAgentNumberStatus(phone, status) {
        try {
            const result = await AdminApiService.updatePhoneNumberStatus(phone, status);
            if (result.success) { this.showToast(`Number ${status === 'Active' ? 'activated' : 'deactivated'}`); this.loadPhoneNumbers(); }
            else this.showToast(result.message || 'Failed to update number', 'error');
        } catch (error) { this.showToast('Error updating number', 'error'); }
    },

    // ─── Add User ─────────────────────────────────────────────
    async addUser() {
        const userId = document.getElementById('newUserId').value.trim();
        const name = document.getElementById('newName').value.trim();
        const password = document.getElementById('newPassword').value;
        const confirm = document.getElementById('confirmPassword').value;

        if (!userId || !password || !name) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }
        if (password !== confirm) {
            this.showToast('Passwords do not match', 'error');
            return;
        }
        if (password.length < 6) {
            this.showToast('Password must be at least 6 characters', 'error');
            return;
        }

        try {
            const result = await AdminApiService.addUser({ userId, name, password });
            if (result.success) {
                this.showToast('User added successfully!');
                document.getElementById('addUserForm').reset();
                if (this.currentTab === 'users') this.loadUsers();
            } else {
                this.showToast(result.message || 'Failed to add user', 'error');
            }
        } catch (error) { this.showToast('Error adding user', 'error'); }
    },

    // ─── Pagination ──────────────────────────────────────────
    renderPagination(containerId, { page, totalPages, total, limit }, onPageChange) {
        const container = document.getElementById(containerId);
        if (!container) return;
        if (totalPages <= 1) { container.innerHTML = ''; return; }

        const handlerKey = `_pgHandler_${containerId}`;
        AdminDashboard[handlerKey] = onPageChange;

        const start = (page - 1) * limit + 1;
        const end = Math.min(page * limit, total);

        let pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages = [1];
            if (page > 3) pages.push('...');
            for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
            if (page < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }

        container.innerHTML = `
            <div class="pagination-info">Showing ${start}–${end} of ${total}</div>
            <div class="pagination-controls">
                <button class="pg-btn" ${page === 1 ? 'disabled' : ''} onclick="AdminDashboard['${handlerKey}'](${page - 1})">‹ Prev</button>
                ${pages.map(p => p === '...'
            ? `<span class="pg-ellipsis">…</span>`
            : `<button class="pg-btn ${p === page ? 'active' : ''}" onclick="AdminDashboard['${handlerKey}'](${p})">${p}</button>`
        ).join('')}
                <button class="pg-btn" ${page === totalPages ? 'disabled' : ''} onclick="AdminDashboard['${handlerKey}'](${page + 1})">Next ›</button>
            </div>`;
    },

    // ─── Misc ────────────────────────────────────────────────
    startAutoRefresh() {
        this.refreshInterval = setInterval(() => this.loadDashboardData(), 30000);
    },

    logout() {
        sessionStorage.clear();
        window.location.href = '/';
    },

    formatDateTime(timestamp) {
        if (!timestamp) return 'N/A';
        return new Date(timestamp).toLocaleString();
    },

    getStatusClass(status) {
        return {
            sent: 'success',
            failed: 'danger',
            pending: 'warning',
            processing: 'info',
            Active: 'success',
            Inactive: 'danger'
        }[status] || 'info';
    }
};

document.addEventListener('DOMContentLoaded', () => { AdminDashboard.init(); });