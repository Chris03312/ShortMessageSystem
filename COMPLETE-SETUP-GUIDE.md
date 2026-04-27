# 🎉 SMS Blast - Complete Setup Guide

## ✅ Your System is Ready!

All files are properly configured. Here's everything you need to know:

---

## 📋 System Overview

### Architecture
```
┌──────────────────────────────────────┐
│    CENTRAL SERVER                     │
│    (192.168.3.239:3001)              │
│                                       │
│  • Database                          │
│  • API Endpoints                     │
│  • Web Interface (Admin)             │
│  • Queue Worker                      │
└──────┬─────────────────┬─────────────┘
       │                 │
   ┌───▼────┐      ┌────▼──────┐
   │  Web   │      │ Desktop   │
   │ Admin  │      │ Agents    │
   └────────┘      └───────────┘
```

### Access Control
- ✅ **Admins** → Can access via Web Browser OR Desktop App
- ✅ **Agents** → Must use Desktop App ONLY (blocked from web)

---

## 🚀 Quick Start

### 1. Start the Server (Central Machine)

```bash
cd SMS
npm install
npm run start:server
```

**Expected Output:**
```
🔄 Initializing database...
✅ Database initialized
✅ Queue worker started
═══════════════════════════════════════
🚀 Bulk SMS Server Started
📡 Server: http://localhost:3001
🌐 Environment: development
⏰ Started: 4/27/2026, 2:45:30 PM
═══════════════════════════════════════
```

### 2. Test Web Access (Admin)

Open browser: `http://localhost:3001`
- Login with admin credentials
- Should see admin dashboard ✅

### 3. Test Desktop App (Agent)

```bash
npm start
```

- Desktop window opens
- Connects to server
- Shows login page
- Agent can login ✅

---

## 📁 File Structure

```
SMS/
├── .env                      ← Server configuration (EDIT THIS!)
├── .env.example              ← Template for deployment
├── server-web.js             ← Central server
├── electron-main.js          ← Desktop app (client-only)
├── package.json
│
├── public/
│   ├── javascript/
│   │   ├── config.js         ← Loads from /api/config
│   │   ├── login.js          ← Blocks agents from web
│   │   ├── app.js
│   │   └── admin.js
│   └── ...
│
├── databases/
├── routes/
├── controllers/
└── models/
```

---

## ⚙️ Configuration

### Edit `.env` for your network:

```env
# Change these for production:
SERVER_IP=192.168.3.239    ← Your server's actual IP
SERVER_PORT=3001            ← Port number
NODE_ENV=production         ← Set to production

# Leave these as default:
ALLOWED_ORIGIN=*
ENDPOINT_SEND_SMS=/send-sms
... (rest of endpoints)
```

---

## 🔒 Security Features

### Agent Web Blocking

When an agent tries to login from web browser:

1. Login page detects: `isElectron = false`
2. After authentication: checks `role !== 'admin'`
3. Shows error: "Desktop App Required" 🚫
4. Redirects to download page

### Admin Access

- ✅ Can login from web browser
- ✅ Can login from desktop app
- ✅ Full system access

---

## 🎯 Testing Checklist

### ✅ Server Tests

- [ ] Server starts without errors
- [ ] Database initializes
- [ ] Queue worker starts
- [ ] `/api/config` returns JSON
- [ ] Web login page loads

### ✅ Admin Tests (Web Browser)

- [ ] Can access `http://SERVER_IP:3001`
- [ ] Login page loads
- [ ] Admin login successful
- [ ] Redirects to admin dashboard
- [ ] All features work

### ✅ Agent Tests (Desktop App)

- [ ] Desktop app opens
- [ ] Connects to server
- [ ] Login page appears
- [ ] Agent login successful
- [ ] Redirects to blast dashboard
- [ ] Can send SMS

### ✅ Agent Blocking (Web Browser)

- [ ] Agent tries web login
- [ ] Login accepts credentials
- [ ] Shows "Desktop App Required" error
- [ ] Cannot access dashboard

### ✅ Server Dependency

- [ ] Desktop app running, server running → Works ✅
- [ ] Stop server → Desktop shows error ❌
- [ ] Start server → Click "Retry" → Works ✅

---

## 📦 Building Desktop App

### For Windows:

```bash
npm run build:win
```

Output: `dist/SMS Blast Setup.exe`

### For Mac:

```bash
npm run build:mac
```

Output: `dist/SMS Blast.dmg`

### For Linux:

```bash
npm run build:linux
```

Output: `dist/SMS Blast.AppImage`

---

## 🌐 Deployment Guide

### Server Deployment

1. **Copy to server machine**
   ```bash
   # Upload entire SMS folder
   ```

2. **Edit `.env`**
   ```env
   SERVER_IP=192.168.3.239
   NODE_ENV=production
   ```

3. **Install dependencies**
   ```bash
   npm install --production
   ```

4. **Run with PM2 (recommended)**
   ```bash
   npm install -g pm2
   pm2 start server-web.js --name sms-blast
   pm2 save
   pm2 startup
   ```

5. **Configure firewall**
   ```bash
   # Allow port 3001
   sudo ufw allow 3001/tcp
   ```

### Desktop App Distribution

1. **Build installer**
   ```bash
   npm run build:win
   ```

2. **Test installer**
   - Run `dist/SMS Blast Setup.exe`
   - Install on test machine
   - Verify connection to server

3. **Distribute to agents**
   - Copy installer to shared drive
   - Or send via email
   - Or host on internal server

4. **Agent installation**
   - Double-click installer
   - Follow wizard
   - Launch app
   - Login with credentials

---

## 🔧 Troubleshooting

### Server Issues

**Problem:** Database not initializing
```
Solution:
- Check database file permissions
- Verify databases/ folder exists
- Delete .sqlite-wal and .sqlite-shm files
```

**Problem:** Port already in use
```
Solution:
- Change SERVER_PORT in .env
- Or kill process on port 3001:
  Windows: netstat -ano | findstr :3001
  Linux: kill $(lsof -t -i:3001)
```

### Desktop App Issues

**Problem:** Cannot connect to server
```
Solution:
- Verify server is running
- Check SERVER_IP in .env matches server
- Test: curl http://192.168.3.239:3001/api/config
- Check firewall allows connection
```

**Problem:** Shows error even when server is up
```
Solution:
- Check server IP is correct
- Verify network connectivity: ping 192.168.3.239
- Ensure server is listening on 0.0.0.0, not 127.0.0.1
```

### Web Access Issues

**Problem:** Agent can still access web
```
Solution:
- Verify login.js has agent blocking code
- Check browser console for isElectron value
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
```

---

## 📊 Monitoring

### Check Server Status

```bash
# If using PM2
pm2 status
pm2 logs sms-blast

# Check port is listening
netstat -an | findstr :3001    # Windows
netstat -an | grep :3001       # Linux
```

### View Logs

```bash
# PM2 logs
pm2 logs sms-blast

# Server console output
# (if running directly)
```

---

## 🎓 Key Concepts

### No Hardcoded URLs
All API endpoints are loaded from `.env` via `/api/config`

### Client-Server Architecture
Desktop app is a **client** that connects to **server**

### Role-Based Access
- Admin → Everywhere
- Agent → Desktop only

### Server Dependency
Desktop app **requires** server to be running

---

## 📞 Support

### Common Questions

**Q: Can agents work offline?**
A: No, desktop app requires server connection

**Q: Can we have multiple servers?**
A: Not recommended. One central server is best.

**Q: How to change server IP after deployment?**
A: Edit `.env` on server, rebuild desktop app

**Q: Can admin use desktop app?**
A: Yes, admin can use both web and desktop

**Q: How to add new endpoints?**
A: Add to `.env`, update server routes, restart

---

## ✅ Success Criteria

Your system is working correctly when:

- ✅ Server starts without errors
- ✅ Web admin can login
- ✅ Desktop agent can login
- ✅ Agent blocked from web
- ✅ Desktop app shows error when server stops
- ✅ "Retry" works after server restarts

---

## 🎉 You're All Set!

Your SMS Blast system is now:
- ✅ Fully configured
- ✅ Using .env for all settings
- ✅ Client-server architecture
- ✅ Role-based access control
- ✅ Server-dependent desktop app

**Next Steps:**
1. Test everything locally
2. Deploy to production server
3. Build and distribute desktop app
4. Train users
5. Monitor and maintain

Good luck! 🚀
