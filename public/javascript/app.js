// Main Application Logic
const App = {
    isCancelled: false,

    // ── Helpers ───────────────────────────────────────────────────
    getUser() {
        try { return JSON.parse(sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER)); }
        catch { return null; }
    },

    getSessionId() {
        return sessionStorage.getItem('tabSessionId');
    },

    setSessionId(id) {
        sessionStorage.setItem('tabSessionId', id);
    },

    // ── Init ──────────────────────────────────────────────────────
    async init() {
        // Wait for config to load from server
        await waitForConfig();
        
        UI.init();
        this.checkUserSession();
        this.setupEventListeners();
        this.loadFormData();
        this.setupGatewayUrlAutoFormat();

        window.addEventListener('beforeunload', () => {
            const sessionId = this.getSessionId();
            if (sessionId) {
                navigator.sendBeacon(
                    API_CONFIG.BASE_URL + '/auth/cancel-session',
                    new Blob([JSON.stringify({ sessionId })], { type: 'application/json' })
                );
            }
        });
    },

    // ── Session check ─────────────────────────────────────────────
    async checkUserSession() {
        const userData = this.getUser();

        if (!userData) {
            UI.showModal();
            return;
        }

        if (userData.role === 'admin') {
            window.location.href = '/admin-dashboard.html';
            return;
        }

        const sessionId = this.getSessionId();
        if (sessionId && userData.currentPhone) {
            UI.updateCurrentNumber(userData.currentPhone);
            this.startLogCounter();
        } else {
            if (userData.user_id) {
                const userIdField = document.getElementById('user-id');
                if (userIdField) userIdField.value = userData.user_id;
            }
            UI.showModal();
        }
    },

    // ── Event listeners ───────────────────────────────────────────
    setupEventListeners() {
        document.getElementById('confirmUserBtn').addEventListener('click', () => this.handlePhoneVerification());
        document.getElementById('smsForm').addEventListener('submit', (e) => this.handleSmsSubmit(e));
        document.getElementById('cancelSending').addEventListener('click', () => this.handleCancel());
        document.getElementById('checkGateway').addEventListener('click', () => this.handleCheckGateway());
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        document.getElementById('logout').addEventListener('click', () => this.logout());
    },

    // ── Phone verification ────────────────────────────────────────
    async handlePhoneVerification() {
        const userId = document.getElementById('user-id').value.trim();
        const currentPhone = document.getElementById('pnumber').value.trim();

        if (!userId || !currentPhone) {
            UI.showModalError('⚠️ All fields are required.');
            return;
        }

        const phonePattern = /^09\d{9}$/;
        if (!phonePattern.test(currentPhone)) {
            UI.showModalError('⚠️ Phone must be 11 digits starting with 09');
            return;
        }

        try {
            const data = await ApiService.verifyUser(userId, currentPhone);

            if (!data.success) {
                UI.showModalError(data.message || '❌ User ID not found or inactive.');
                return;
            }

            await ApiService.insertAgentNumbers(data.user.user_id, data.user.name, currentPhone);
            this.setSessionId(data.sessionId);

            sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify({
                user_id: data.user.user_id,
                name: data.user.name,
                currentPhone,
                role: 'user'
            }));

            UI.hideModal();
            setTimeout(() => location.reload(), 300);

        } catch (err) {
            console.error('❌ Phone verification error:', err.message);
            UI.showModalError(`❌ Network error: ${err.message}`);
        }
    },

    // ── Log counter ───────────────────────────────────────────────
    startLogCounter() {
        setInterval(() => this.countSentLogs(), 5000);
        this.countSentLogs();
    },

    async countSentLogs() {
        const userData = this.getUser();
        if (!userData) return;
        try {
            const data = await ApiService.countSentLogs(userData.name);
            if (data.success) UI.updateTotalSent(data.count);
        } catch (error) {
            console.warn('❌ Error counting logs:', error.message);
        }
    },

    // ── SMS send ──────────────────────────────────────────────────
    async handleSmsSubmit(e) {
        e.preventDefault();

        const userData = this.getUser();
        if (!userData) { alert('Session expired. Please refresh.'); return; }

        const name = userData.name;
        const number = userData.currentPhone;
        const message = document.getElementById('message').value.trim();
        const rawNums = document.getElementById('phoneNumbers').value.trim();
        const gatewayUrl = document.getElementById('gatewayUrl').value.trim();
        const gatewayToken = document.getElementById('gatewayToken').value.trim();
        const delay = parseInt(document.getElementById('delaySelect').value);

        UI.clearLog();
        UI.clearFailedContainer();
        UI.updateStatus('');

        const phoneNumbers = rawNums
            .split(';')
            .map(p => p.trim())
            .filter(p => p.length > 0 && /^\d+$/.test(p));

        if (phoneNumbers.length === 0) { alert('No valid phone numbers found.'); return; }
        if (!message || !gatewayUrl || !gatewayToken) { alert('Please fill in all fields.'); return; }
        if (!confirm(`Send message to ${phoneNumbers.length} numbers?`)) return;

        this.saveFormData();
        this.isCancelled = false;

        let sent = 0, failed = 0;
        UI.updateStatus(`📤 Sending ${phoneNumbers.length} messages...`);

        for (let i = 0; i < phoneNumbers.length; i++) {
            if (this.isCancelled) {
                UI.appendLog(`⛔ Sending cancelled by user\n`);
                UI.updateStatus(`⛔ Cancelled — Sent: ${sent}, Failed: ${failed}`);
                break;
            }

            const phone = phoneNumbers[i];
            UI.appendLog(`📱 Sending to ${phone}... `);

            try {
                const result = await ApiService.sendSms(phone, message, gatewayUrl, gatewayToken, delay, name, number);

                if (Array.isArray(result) && result[0]) {
                    const r = result[0];
                    if (r.status === 'sent') { UI.appendLog(`✅ Sent\n`); sent++; }
                    else if (r.status === 'failed') { UI.appendLog(`❌ ${r.error}\n`); failed++; UI.addFailedItem(phone, r.error); }
                    else if (r.status === 'canceled') { UI.appendLog(`⛔ Canceled\n`); UI.updateStatus('❌ Sending canceled.'); break; }
                } else if (result && result.success === false) {
                    UI.appendLog(`❌ ${result.message || 'Error'}\n`);
                    UI.updateStatus(result.message || '❌ Error occurred.');
                    break;
                }
            } catch (err) {
                console.error(`❌ Send error for ${phone}:`, err.message);
                UI.appendLog(`❌ Error: ${err.message}\n`);
                failed++;
            }

            UI.updateSentCount(sent);
            UI.updateFailedCount(failed);
            UI.updateStatus(`✅ Sent: ${sent} ❌ Failed: ${failed} / Total: ${phoneNumbers.length}`);

            if (this.isCancelled) break;
            if (i < phoneNumbers.length - 1) await new Promise(r => setTimeout(r, delay));
        }

        if (!this.isCancelled) {
            UI.updateStatus(`✅ Done — Sent: ${sent}, Failed: ${failed}`);
        }
    },

    // ── Cancel THIS tab's sending + session ───────────────────────
    async handleCancel() {
        if (!confirm('⚠️ Cancel sending and release this tab\'s phone number?')) return;

        this.isCancelled = true;

        const sessionId = this.getSessionId();
        const userData = this.getUser();

        try {
            if (sessionId) {
                await ApiService.cancelSession(sessionId);
                sessionStorage.removeItem('tabSessionId');
            } else if (userData) {
                await ApiService.cancelSending(userData.user_id);
            }

            alert('✅ Sending cancelled. Please verify your phone number again.');

            if (userData) {
                sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify({
                    user_id: userData.user_id,
                    name: userData.name,
                    role: userData.role
                }));
            }

            setTimeout(() => window.location.reload(), 300);

        } catch (err) {
            console.error('❌ Cancel error:', err.message);
            alert('Error: ' + err.message);
        }
    },

    // ── Gateway check ─────────────────────────────────────────────
    async handleCheckGateway() {
        const url = document.getElementById('gatewayUrl')?.value.trim() ?? '';
        const token = document.getElementById('gatewayToken')?.value.trim() ?? '';

        UI.updateGatewayStatus('⏳ Checking...', 'loading');

        if (!url || !token) {
            UI.updateGatewayStatus('❌ Enter URL and token first', 'error');
            return;
        }

        try {
            const data = await ApiService.checkGateway(url, token);

            if (!data.success) {
                let errorMessage = typeof data.message === 'object' && data.message !== null
                    ? (data.message.error || data.message.message || JSON.stringify(data.message))
                    : (data.message || 'Unreachable');

                console.error('❌ Gateway check failed:', errorMessage);
                UI.updateGatewayStatus(`❌ ${errorMessage}`, 'error');
                return;
            }

            if (data.needsConfirmation) {
                const confirmResend = confirm(
                    `✅ Gateway valid.\n\n⚠️ ${data.queuedCount} queued message(s) found.\n\nResend with this URL?`
                );

                const confirmData = await ApiService.checkGateway(url, token, confirmResend);

                let confirmMessage = typeof confirmData.message === 'object' && confirmData.message !== null
                    ? (confirmData.message.error || confirmData.message.message || JSON.stringify(confirmData.message))
                    : confirmData.message;

                UI.updateGatewayStatus(confirmMessage, confirmData.success ? 'success' : 'error');
                return;
            }

            let successMessage = typeof data.message === 'object' && data.message !== null
                ? (data.message.error || data.message.message || JSON.stringify(data.message))
                : data.message;

            UI.updateGatewayStatus(successMessage, 'success');

        } catch (err) {
            console.error('❌ Gateway check exception:', err.message);
            UI.updateGatewayStatus(`❌ Network error: ${err.message}`, 'error');
        }
    },

    // ── Logout ────────────────────────────────────────────────────
    async logout() {
        const userData = this.getUser();

        if (userData) {
            try {
                await ApiService.logoutUser(userData.user_id);
            } catch (err) {
                console.error('❌ Logout error:', err.message);
            }
        }

        sessionStorage.clear();
        window.location.href = '/';
    },

    // ── Form persistence ──────────────────────────────────────────
    saveFormData() {
        const data = {
            message: document.getElementById('message').value,
            phoneNumbers: document.getElementById('phoneNumbers').value,
            gatewayUrl: document.getElementById('gatewayUrl').value,
            gatewayToken: document.getElementById('gatewayToken').value,
            delaySelect: document.getElementById('delaySelect').value
        };
        localStorage.setItem(STORAGE_KEYS.FORM_DATA, JSON.stringify(data));
    },

    loadFormData() {
        const raw = localStorage.getItem(STORAGE_KEYS.FORM_DATA);
        if (!raw) return;
        try {
            const d = JSON.parse(raw);
            if (d.message) document.getElementById('message').value = d.message;
            if (d.phoneNumbers) document.getElementById('phoneNumbers').value = d.phoneNumbers;
            if (d.gatewayUrl) document.getElementById('gatewayUrl').value = d.gatewayUrl;
            if (d.gatewayToken) document.getElementById('gatewayToken').value = d.gatewayToken;
            if (d.delaySelect) document.getElementById('delaySelect').value = d.delaySelect;
        } catch { }
    },

    setupGatewayUrlAutoFormat() {
        const input = document.getElementById('gatewayUrl');
        input.addEventListener('blur', () => {
            let url = input.value.trim();
            if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
                input.value = 'http://' + url;
            }
        });
    }
};

window.addEventListener('load', () => { App.init(); });