// ─── Dynamic Configuration Loader ────────────────────────────────────────────
// This file loads configuration from the server instead of hardcoding values.
// The server reads from .env and serves it via /api/config endpoint.

let API_CONFIG = null;
let STORAGE_KEYS = null;
let configLoaded = false;

// Function to load config from server
async function loadConfig() {
    if (configLoaded) return;

    try {
        // Try to get config from server
        const response = await fetch('/api/config');

        if (!response.ok) {
            throw new Error(`Failed to fetch config: ${response.status} ${response.statusText}`);
        }

        const config = await response.json();

        // Build API_CONFIG from server response
        API_CONFIG = {
            BASE_URL: `http://${config.SERVER_IP}:${config.SERVER_PORT}/api`,
            SERVER_BASE: `http://${config.SERVER_IP}:${config.SERVER_PORT}`,
            ENDPOINTS: config.ENDPOINTS
        };

        STORAGE_KEYS = config.STORAGE_KEYS;
        configLoaded = true;

        console.log('✅ Configuration loaded from server');
    } catch (error) {
        console.error('❌ Failed to load configuration from server');

        // Show error page to user
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #1a1a1a; color: #fff; font-family: system-ui, -apple-system, sans-serif;">
                <div style="text-align: center; padding: 2rem; max-width: 500px;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">⚠️</div>
                    <h1 style="font-size: 1.5rem; margin-bottom: 1rem; color: #ff6b6b;">Server Not Available</h1>
                    <p style="color: #aaa; margin-bottom: 1.5rem; line-height: 1.6;">
                        Unable to connect to the SMS Blast server. Please check:
                    </p>
                    <ul style="text-align: left; color: #aaa; margin-bottom: 2rem; line-height: 1.8;">
                        <li>Server is running</li>
                        <li>Network connection is active</li>
                        <li>Firewall settings allow access</li>
                        <li>Server IP and port are configured correctly</li>
                    </ul>
                    <button onclick="location.reload()" style="background: #4CAF50; color: white; border: none; padding: 0.75rem 2rem; border-radius: 5px; font-size: 1rem; cursor: pointer;">
                        Retry Connection
                    </button>
                    <p style="color: #666; margin-top: 1.5rem; font-size: 0.875rem;">
                        Error: ${error.message}
                    </p>
                </div>
            </div>
        `;

        throw new Error('Server configuration not available');
    }
}

// Auto-load config when script loads
loadConfig();

// Helper function to ensure config is loaded before use
function waitForConfig() {
    return new Promise((resolve) => {
        const checkConfig = setInterval(() => {
            if (configLoaded) {
                clearInterval(checkConfig);
                resolve();
            }
        }, 50);
    });
}