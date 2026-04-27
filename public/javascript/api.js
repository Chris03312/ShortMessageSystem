// API Service Module
const ApiService = {
    async verifyUser(userId, currentPhone) {
        const response = await fetch(API_CONFIG.BASE_URL + '/auth/verify-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, currentPhone })
        });
        return response.json();
    },

    async insertAgentNumbers(userId, name, currentPhone) {
        const response = await fetch(API_CONFIG.BASE_URL + '/auth/insert-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, name, currentPhone })
        });
        return response.json();
    },

    async cancelSession(sessionId) {
        const response = await fetch(API_CONFIG.BASE_URL + '/auth/cancel-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId })
        });
        return response.json();
    },

    async logoutUser(userId) {
        const response = await fetch(API_CONFIG.BASE_URL + '/auth/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        return response.json();
    },

    async sendSms(phone, message, gatewayUrl, gatewayToken, delay, name, number) {
        const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.SEND_SMS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, message, gatewayUrl, gatewayToken, delayMs: delay, name, number })
        });
        return response.json();
    },

    async cancelSending(userId) {
        const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.CANCEL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId })
        });
        return response.json();
    },

    async checkGateway(gatewayUrl, gatewayToken, confirmResend = undefined) {
        const payload = { gatewayUrl, gatewayToken, confirmResend };
        const apiUrl = API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.CHECK_GATEWAY;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const responseText = await response.text();

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (err) {
            console.error('❌ checkGateway: Invalid JSON response:', responseText);
            throw new Error('Invalid JSON response from server');
        }

        return data;
    },

    async countSentLogs(name) {
        const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.COUNT_LOGS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        return response.json();
    }
};