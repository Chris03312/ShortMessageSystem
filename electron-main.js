const { app, BrowserWindow } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development';

// Server configuration - reads from environment or uses defaults
const SERVER_IP = process.env.SERVER_IP || 'localhost';
const SERVER_PORT = process.env.SERVER_PORT || '3001';
const SERVER_URL = `http://${SERVER_IP}:${SERVER_PORT}`;

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 700,
        backgroundColor: '#1a1a2e',
        icon: path.join(__dirname, 'public', 'icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'electron-preload.js')
        },
        autoHideMenuBar: false,
        show: false
    });

    console.log('═══════════════════════════════════════');
    console.log('📱 SMS Blast Desktop App');
    console.log(`🔗 Connecting to: ${SERVER_URL}`);
    console.log('═══════════════════════════════════════');

    // Load from external server instead of local server
    mainWindow.loadURL(SERVER_URL);

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        if (isDev) {
            mainWindow.webContents.openDevTools();
        }
    });

    // Handle failed to load (server not available)
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('❌ Failed to connect to server:', errorDescription);

        // Show error page
        mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Server Not Available</title>
                <style>
                    body {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        margin: 0;
                        background: #1a1a1a;
                        color: #fff;
                        font-family: system-ui, -apple-system, sans-serif;
                    }
                    .container {
                        text-align: center;
                        padding: 2rem;
                        max-width: 500px;
                    }
                    h1 { color: #ff6b6b; font-size: 2rem; margin-bottom: 1rem; }
                    p { color: #aaa; line-height: 1.6; margin-bottom: 1.5rem; }
                    .icon { font-size: 4rem; margin-bottom: 1rem; }
                    button {
                        background: #4CAF50;
                        color: white;
                        border: none;
                        padding: 0.75rem 2rem;
                        border-radius: 5px;
                        font-size: 1rem;
                        cursor: pointer;
                        margin: 0.5rem;
                    }
                    button:hover { background: #45a049; }
                    .server-info {
                        background: #2a2a2a;
                        padding: 1rem;
                        border-radius: 5px;
                        margin: 1.5rem 0;
                        color: #888;
                        font-family: monospace;
                        font-size: 0.9rem;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="icon">⚠️</div>
                    <h1>Cannot Connect to Server</h1>
                    <p>Server is not available. Please check if:</p>
                    <ul style="text-align: left; color: #aaa; line-height: 1.8;">
                        <li>Server is running</li>
                        <li>Server address is correct</li>
                        <li>Network connection is active</li>
                        <li>Firewall allows connection</li>
                    </ul>
                    <p style="color: #666; margin-top: 2rem; font-size: 0.875rem;">
                        ${errorDescription}
                    </p>
                </div>
            </body>
            </html>
        `)}`);
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// ─── App lifecycle ────────────────────────────────────────────────────────────

app.on('ready', () => {
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// ─── Electron remote requirement ──────────────────────────────────────────────
// Enable remote module for error page button
if (process.versions.electron) {
    try {
        require('@electron/remote/main').initialize();
    } catch (e) {
        // Remote module not available or not needed
    }
}