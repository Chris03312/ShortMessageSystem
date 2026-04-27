const UI = {
    elements: {
        modal: null,
        messageBox: null,
        currentNumber: null,
        totalSent: null,
        sentCount: null,
        failedCount: null,
        status: null,
        log: null,
        failedContainer: null,
        queuedContainer: null,
        gatewayStatus: null,
        message: null,
        charCount: null,
        userName: null,
        userInitial: null
    },

    /**
     * Initialize UI element references
     */
    init() {
        this.elements.modal = document.getElementById('modal');
        this.elements.messageBox = document.getElementById('messageBox');
        this.elements.currentNumber = document.getElementById('currentNumber');
        this.elements.totalSent = document.getElementById('totalSent');
        this.elements.sentCount = document.getElementById('sentCount');
        this.elements.failedCount = document.getElementById('failedCount');
        this.elements.status = document.getElementById('status');
        this.elements.log = document.getElementById('log');
        this.elements.failedContainer = document.getElementById('failedContainer');
        this.elements.queuedContainer = document.getElementById('queuedContainer');
        this.elements.gatewayStatus = document.getElementById('gatewayStatus');
        this.elements.message = document.getElementById('message');
        this.elements.charCount = document.getElementById('charCount');
        this.elements.userName = document.getElementById('userName');
        this.elements.userInitial = document.getElementById('userInitial');

        if (this.elements.message && this.elements.charCount) {
            this.setupCharCounter();
        }

        this.updateUserInfo();
    },

    /**
     * Setup character counter for message textarea
     */
    setupCharCounter() {
        this.elements.message.addEventListener('input', (e) => {
            const length = e.target.value.length;
            this.elements.charCount.textContent = `${length} / 160`;

            if (length > 160) {
                this.elements.charCount.style.color = '#F43F5E';
            } else if (length > 140) {
                this.elements.charCount.style.color = '#F59E0B';
            } else {
                this.elements.charCount.style.color = '';
            }
        });
    },

    /**
     * Update user info in navbar
     */
    updateUserInfo() {
        try {
            const userData = JSON.parse(sessionStorage.getItem('currentUser'));
            if (userData && userData.name) {
                if (this.elements.userName) {
                    this.elements.userName.textContent = userData.name;
                }
                if (this.elements.userInitial) {
                    this.elements.userInitial.textContent = userData.name.charAt(0).toUpperCase();
                }
            }
        } catch (error) {
            console.warn('Could not load user info:', error);
        }
    },

    /**
     * Show modal
     */
    showModal() {
        this.elements.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    },

    /**
     * Hide modal
     */
    hideModal() {
        this.elements.modal.style.display = 'none';
        document.body.style.overflow = '';
    },

    /**
     * Show error message in modal
     */
    showModalError(message) {
        this.elements.messageBox.innerText = message;
        this.elements.messageBox.style.display = 'block';
    },

    /**
     * Hide modal error
     */
    hideModalError() {
        this.elements.messageBox.style.display = 'none';
    },

    /**
     * Update current number display
     */
    updateCurrentNumber(number) {
        this.elements.currentNumber.innerText = number;
        this.elements.currentNumber.classList.add('active-session');
    },

    /**
     * Update total sent count with animation
     */
    updateTotalSent(count) {
        this.animateNumber(this.elements.totalSent, count);
    },

    /**
     * Update sent count with animation
     */
    updateSentCount(count) {
        this.animateNumber(this.elements.sentCount, count);
    },

    /**
     * Update failed count with animation
     */
    updateFailedCount(count) {
        this.animateNumber(this.elements.failedCount, count);
    },

    /**
     * Animate number changes
     */
    animateNumber(element, newValue) {
        const currentValue = parseInt(element.textContent) || 0;
        if (currentValue === newValue) return;

        element.textContent = newValue;
        element.style.transform = 'scale(1.2)';
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 200);
    },

    /**
     * Update status text
     */
    updateStatus(text) {
        this.elements.status.textContent = text;
    },

    /**
     * Append to log with timestamp
     */
    appendLog(text) {
        const timestamp = new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        const logEntry = `[${timestamp}] ${text}`;
        this.elements.log.innerHTML += logEntry;
        this.elements.log.scrollTop = this.elements.log.scrollHeight;
    },

    /**
     * Clear log
     */
    clearLog() {
        this.elements.log.innerHTML = 'System ready. Awaiting commands...\n';
    },

    /**
     * Add failed item to container
     */
    addFailedItem(phone, error) {
        // Remove empty state if exists
        const emptyState = this.elements.failedContainer.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }

        const failedItem = document.createElement('div');
        failedItem.className = 'failed-item';
        failedItem.innerHTML = `<strong>${phone}</strong><small>${error}</small>`;

        // Animate in
        failedItem.style.opacity = '0';
        failedItem.style.transform = 'translateY(-10px)';
        this.elements.failedContainer.insertBefore(failedItem, this.elements.failedContainer.firstChild);

        setTimeout(() => {
            failedItem.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
            failedItem.style.opacity = '1';
            failedItem.style.transform = 'translateY(0)';
        }, 10);
    },

    /**
     * Clear failed container
     */
    clearFailedContainer() {
        this.elements.failedContainer.innerHTML = `
            <div class="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
                <p>No failed messages</p>
            </div>
        `;
    },

    /**
     * Update gateway status
     */
    updateGatewayStatus(text, type) {
        this.elements.gatewayStatus.textContent = text;
        this.elements.gatewayStatus.style.display = 'block';

        this.elements.gatewayStatus.className = 'gateway-status';

        const styles = {
            loading: {
                background: '#FFFBEB',
                color: '#92400E',
                borderLeft: '3px solid #F59E0B'
            },
            success: {
                background: '#ECFDF5',
                color: '#065F46',
                borderLeft: '3px solid #10B981'
            },
            error: {
                background: '#FEF2F2',
                color: '#991B1B',
                borderLeft: '3px solid #F43F5E'
            }
        };

        const style = styles[type] || styles.error;
        Object.assign(this.elements.gatewayStatus.style, style);
    },

    /**
     * Clear gateway status
     */
    clearGatewayStatus() {
        this.elements.gatewayStatus.style.display = 'none';
    },

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        let toast = document.getElementById('toast-notification');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast-notification';
            toast.style.cssText = `
                position: fixed;
                bottom: 2rem;
                right: 2rem;
                padding: 1rem 1.5rem;
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
                font-weight: 600;
                font-size: 0.9375rem;
                z-index: 10000;
                transform: translateY(100px);
                opacity: 0;
                transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                border-left: 4px solid;
            `;
            document.body.appendChild(toast);
        }

        const colors = {
            success: { bg: '#ECFDF5', text: '#065F46', border: '#10B981' },
            error: { bg: '#FEF2F2', text: '#991B1B', border: '#F43F5E' },
            warning: { bg: '#FFFBEB', text: '#92400E', border: '#F59E0B' },
            info: { bg: '#EFF6FF', text: '#1E40AF', border: '#3B82F6' }
        };

        const color = colors[type] || colors.info;
        toast.style.background = color.bg;
        toast.style.color = color.text;
        toast.style.borderLeftColor = color.border;
        toast.textContent = message;

        // Show toast
        setTimeout(() => {
            toast.style.transform = 'translateY(0)';
            toast.style.opacity = '1';
        }, 10);

        // Hide toast after 3 seconds
        setTimeout(() => {
            toast.style.transform = 'translateY(100px)';
            toast.style.opacity = '0';
        }, 3000);
    }
};