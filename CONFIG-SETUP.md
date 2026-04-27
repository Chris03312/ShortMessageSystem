# Configuration Setup Guide

## Overview

This application uses a **centralized server configuration** approach. Instead of hardcoding API endpoints in the frontend JavaScript files, all configuration is:

1. Stored in a `.env` file on the server
2. Loaded by the backend using `dotenv`
3. Served to the frontend via `/api/config` endpoint
4. Dynamically loaded by the frontend JavaScript

This means **end-users never need to edit JavaScript files**. All configuration is done through the `.env` file.

---

## Initial Setup

### 1. Copy the example environment file

```bash
cp .env.example .env
```

### 2. Edit `.env` with your settings

```bash
nano .env
```

**Important settings:**

```env
# Change this to your server's IP address
SERVER_IP=192.168.3.239

# Server port
SERVER_PORT=3001

# Environment (development or production)
NODE_ENV=production
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the server

```bash
npm run start:web
```

---

## How It Works

### Backend (Server)

1. **server-web.js** loads `.env` using `dotenv`
2. Creates an `/api/config` endpoint that serves configuration as JSON
3. All API routes use the environment variables

### Frontend (Client)

1. **config.js** fetches configuration from `/api/config` on page load
2. All other JavaScript files wait for config to load before executing
3. No hardcoded URLs or endpoints in the frontend

---

## Configuration Options

### Server Settings

```env
SERVER_IP=192.168.3.239    # Your server's IP address
SERVER_PORT=3001            # Server port
NODE_ENV=production         # Environment mode
ALLOWED_ORIGIN=*            # CORS allowed origins
```

### API Endpoints (Relative Paths)

```env
ENDPOINT_SEND_SMS=/send-sms
ENDPOINT_CANCEL=/cancel-sms
ENDPOINT_CHECK_GATEWAY=/check-gateway
ENDPOINT_COUNT_LOGS=/countSentLogs
ENDPOINT_USERS=/users
ENDPOINT_LOGIN=/auth/login
ENDPOINT_SERVER_INFO=/server-info
```

### Storage Keys (Frontend LocalStorage/SessionStorage)

```env
STORAGE_KEY_ID=ID
STORAGE_KEY_NAME=NAME
STORAGE_KEY_NUMBER=NUMBER
STORAGE_KEY_FORM_DATA=bulkSmsFormData
STORAGE_KEY_CURRENT_USER=currentUser
```

---

## Deployment

### For Centralized Server Setup

1. Edit `.env` on the server:
   ```env
   SERVER_IP=192.168.3.239
   SERVER_PORT=3001
   NODE_ENV=production
   ```

2. Start the server:
   ```bash
   npm run start:web
   ```

3. Clients connect to: `http://192.168.3.239:3001`

### For Electron Desktop App

1. The `.env` file is bundled with the app
2. Edit `.env` before building:
   ```env
   SERVER_IP=localhost
   SERVER_PORT=3001
   ```

3. Build the app:
   ```bash
   npm run build:win   # For Windows
   npm run build:mac   # For macOS
   npm run build:linux # For Linux
   ```

---

## Troubleshooting

### Config not loading

Check browser console for:
```
✅ Configuration loaded from server
```

If you see:
```
❌ Failed to load config from server, using fallback
```

**Possible causes:**
- Server is not running
- `/api/config` endpoint is not accessible
- CORS issues

### Wrong server IP

1. Stop the server
2. Edit `.env` and change `SERVER_IP`
3. Restart the server
4. Clear browser cache and reload

### Cannot connect to server

Make sure:
- Server is running (`npm run start:web`)
- Firewall allows port 3001
- Server IP is correct in `.env`
- CORS is configured properly

---

## Security Notes

- **Never commit `.env` to Git** (already in `.gitignore`)
- Use `.env.example` for documentation
- For production, consider using environment-specific files:
  - `.env.development`
  - `.env.production`
  - `.env.local`

---

## Migration from Hardcoded Config

If you're migrating from the old hardcoded `config.js`:

1. ✅ Old `config.js` has been replaced with dynamic loader
2. ✅ `.env` file contains all configuration
3. ✅ Server serves config via `/api/config`
4. ✅ Frontend loads config automatically

**No manual changes needed!** Just edit `.env` and restart the server.
