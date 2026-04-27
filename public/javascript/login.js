// Login functionality
const LoginApp = {
    async init() {
        // Wait for config to load from server
        await waitForConfig();

        // Check if this is Electron or Web Browser
        this.isElectron = navigator.userAgent.includes('Electron');

        this.checkExistingSession();
        this.setupEventListeners();
    },

    checkExistingSession() {
        const stored = sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        if (!stored || stored === 'undefined' || stored === 'null') {
            sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
            return;
        }
        try {
            const userData = JSON.parse(stored);
            const hasTabSession = sessionStorage.getItem('tabSessionId');
            if (userData && userData.role === 'admin') {
                this.redirectToDashboard('admin');
            } else if (userData && userData.role && hasTabSession) {
                this.redirectToDashboard(userData.role);
            }
        } catch {
            sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        }
    },

    setupEventListeners() {
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
    },

    async handleLogin() {
        const userId = document.getElementById('userId').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!userId || !password) {
            this.showAlert('Please fill in all fields', 'error');
            return;
        }

        try {
            const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.LOGIN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, password })
            });

            const data = await response.json();

            if (data.success) {
                // Check if agent is trying to login from web browser
                if (data.user.role !== 'admin' && !this.isElectron) {
                    this.showAlert('Agents can only access via Desktop App', 'error');
                    this.showAgentBlockMessage();
                    return;
                }

                sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify({
                    user_id: data.user.user_id,
                    name: data.user.name,
                    role: data.user.role
                }));

                this.showAlert('Login successful! Redirecting...', 'success');
                setTimeout(() => this.redirectToDashboard(data.user.role), 1000);
            } else {
                this.showAlert(data.message || 'Invalid credentials', 'error');
            }
        } catch (error) {
            this.showAlert('Network error. Please try again.', 'error');
            console.error('Login error:', error);
        }
    },

    showAlert(message, type) {
        const alertBox = document.getElementById('alertBox');
        alertBox.textContent = message;
        alertBox.className = `alert alert-${type}`;
        alertBox.style.display = 'block';
        if (type === 'success') setTimeout(() => { alertBox.style.display = 'none'; }, 3000);
    },

    showAgentBlockMessage() {
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #1a1a1a; color: #fff; font-family: system-ui, -apple-system, sans-serif;">
                <div style="text-align: center; padding: 2rem; max-width: 500px;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">🚫</div>
                    <h1 style="font-size: 1.5rem; margin-bottom: 1rem; color: #ff6b6b;">Desktop App Required</h1>
                    <p style="color: #aaa; margin-bottom: 1.5rem; line-height: 1.6;">
                        Agents can only access the SMS Blast system through the <strong>Desktop Application</strong>.
                    </p>
                    <p style="color: #aaa; margin-bottom: 2rem; line-height: 1.6;">
                        Please download and install the SMS Blast Desktop App to continue.
                    </p>
                    <button onclick="location.href='/'" style="background: #4CAF50; color: white; border: none; padding: 0.75rem 2rem; border-radius: 5px; font-size: 1rem; cursor: pointer; margin-right: 1rem;">
                        Back to Login
                    </button>
                    <p style="color: #666; margin-top: 2rem; font-size: 0.875rem;">
                        Administrators can login through this web interface.
                    </p>
                </div>
            </div>
        `;
    },

    redirectToDashboard(role) {
        window.location.href = role === 'admin' ? '/admin-dashboard.html' : '/blast-dashboard.html';
    }
};

document.addEventListener('DOMContentLoaded', () => { LoginApp.init(); });