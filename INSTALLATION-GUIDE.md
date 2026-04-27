# 📦 SMS Blast Desktop - Installation & Setup Guide

## 📥 Download Package

You have received: `sms-blast-desktop.zip` or `sms-blast-desktop.tar.gz`

## 🔧 Installation Instructions

### Step 1: Extract the Package

#### Windows:
1. Right-click on `sms-blast-desktop.zip`
2. Select "Extract All..."
3. Choose a destination folder
4. Click "Extract"

#### macOS:
1. Double-click `sms-blast-desktop.zip` or `sms-blast-desktop.tar.gz`
2. The folder will be extracted automatically

#### Linux:
```bash
# For .zip
unzip sms-blast-desktop.zip -d sms-blast-desktop

# For .tar.gz
tar -xzf sms-blast-desktop.tar.gz -C sms-blast-desktop
```

### Step 2: Install Node.js (if not already installed)

Download and install Node.js from: https://nodejs.org/

**Minimum Version Required:** Node.js 16 or higher

To check if Node.js is installed:
```bash
node --version
npm --version
```

### Step 3: Run the Installer

#### Windows:
1. Open the extracted folder
2. Double-click `install-desktop.bat`
3. Wait for installation to complete (may take 2-5 minutes)

#### macOS/Linux:
1. Open Terminal
2. Navigate to the extracted folder:
   ```bash
   cd path/to/sms-blast-desktop
   ```
3. Run the installer:
   ```bash
   chmod +x install-desktop.sh
   ./install-desktop.sh
   ```

### Step 4: Launch the Application

After installation completes:

```bash
npm start
```

The desktop application will launch automatically!

## 🎯 First Time Setup

### Default Access
When you first launch the app:
1. The application will open in a native window
2. Navigate to the login page
3. Check your database or documentation for default credentials
4. Change default passwords immediately for security

### Creating Admin User (if needed)
If no users exist, you may need to create one via the database or registration endpoint.

## 🚀 Usage Modes

### 1. Desktop Application (Recommended)
```bash
npm start
```
- Native window interface
- Best performance
- Standalone operation

### 2. Development Mode
```bash
npm run dev
```
- Includes Chrome DevTools
- Hot reload for development
- Debugging enabled

### 3. Web Server Mode
```bash
npm run start:web
```
- Traditional web server
- Access via browser: http://localhost:3001
- Network accessible
- Multi-user capable

## 📱 Building Standalone Executables

To create distributable executables:

### Windows Executable
```bash
npm run build:win
```
**Output:**
- `dist/SMS Blast Desktop Setup.exe` - Installer
- `dist/SMS Blast Desktop.exe` - Portable version

### macOS Application
```bash
npm run build:mac
```
**Output:**
- `dist/SMS Blast Desktop.dmg` - DMG installer

### Linux Package
```bash
npm run build:linux
```
**Output:**
- `dist/SMS Blast Desktop.AppImage` - Universal executable
- `dist/sms-blast-desktop_1.0.0_amd64.deb` - Debian package

### All Platforms
```bash
npm run build:all
```

**Note:** Cross-platform building may have limitations. For best results, build on the target operating system.

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=production

# Security
ALLOWED_ORIGIN=*

# Optional: Database path (default: ./databases/agent-sms.sqlite)
# DB_PATH=./databases/agent-sms.sqlite
```

### Changing the Port

If port 3001 is in use:
1. Create/edit `.env` file
2. Change `PORT=3001` to your preferred port
3. Restart the application

## 📁 Important Files & Folders

```
sms-blast-desktop/
├── electron-main.js          ← Electron entry point
├── electron-preload.js       ← Security bridge
├── server-web.js             ← Web server mode
├── databases/
│   └── agent-sms.sqlite     ← Your data (BACKUP THIS!)
├── public/
│   ├── index.html           ← Login page
│   ├── admin-dashboard.html ← Admin panel
│   └── blast-dashboard.html ← SMS interface
└── node_modules/            ← Dependencies (auto-generated)
```

## 🔒 Security Recommendations

1. **Change Default Passwords** immediately after first login
2. **Backup Database** regularly (`databases/agent-sms.sqlite`)
3. **Use Strong Passwords** for all user accounts
4. **Limit Network Access** when running in web server mode
5. **Keep Updated** - install updates when available

## 🐛 Common Issues & Solutions

### Issue: "npm: command not found"
**Solution:** Install Node.js from https://nodejs.org/

### Issue: "Port 3001 already in use"
**Solution:** 
1. Change PORT in `.env` file, OR
2. Stop the conflicting application

### Issue: "Database is locked"
**Solution:**
1. Close all instances of the app
2. Delete `.sqlite-shm` and `.sqlite-wal` files
3. Restart the application

### Issue: "Permission denied" (Linux/macOS)
**Solution:**
```bash
chmod +x install-desktop.sh
./install-desktop.sh
```

### Issue: Build fails with "node-gyp" errors
**Solution:**
```bash
# Install build tools
# Windows: Install Visual Studio Build Tools
# macOS: Install Xcode Command Line Tools
# Linux: Install build-essential

# Then rebuild
npm rebuild
```

### Issue: Application won't start
**Solution:**
1. Check console for error messages
2. Ensure Node.js version is 16+
3. Delete `node_modules` and run `npm install` again
4. Check if port is available

## 📊 Database Management

### Backup Database
```bash
# Copy the database file
cp databases/agent-sms.sqlite databases/backup-$(date +%Y%m%d).sqlite
```

### Restore Database
```bash
# Replace with backup
cp databases/backup-YYYYMMDD.sqlite databases/agent-sms.sqlite
```

### View Database
Use any SQLite browser:
- DB Browser for SQLite (https://sqlitebrowser.org/)
- SQLiteStudio (https://sqlitestudio.pl/)

## 🔄 Updates

### Updating the Application

1. **Backup your database first!**
   ```bash
   cp databases/agent-sms.sqlite databases/backup.sqlite
   ```

2. Download new version

3. Extract to a new folder

4. Copy your database:
   ```bash
   cp old-version/databases/agent-sms.sqlite new-version/databases/
   ```

5. Run installer in new folder

6. Copy your `.env` file if you have custom settings

## 📞 Getting Help

### Check These First:
1. ✅ Node.js version 16+ installed?
2. ✅ All dependencies installed? (`npm install`)
3. ✅ Port 3001 available?
4. ✅ Database file exists and not corrupted?
5. ✅ Console shows any error messages?

### Error Logs
Check the console output for detailed error messages when the app fails to start.

## 🎓 Learning Resources

### API Documentation
See `README.md` for detailed API endpoint documentation.

### Development
- Enable dev mode: `npm run dev`
- Check browser console (F12)
- Review application logs

## 🔧 Uninstallation

### Remove Application
Simply delete the application folder.

### Complete Removal
1. Delete application folder
2. Delete user data (optional):
   - Windows: `%APPDATA%/sms-blast-desktop`
   - macOS: `~/Library/Application Support/sms-blast-desktop`
   - Linux: `~/.config/sms-blast-desktop`

## ✅ Verification Checklist

After installation, verify:
- [ ] Application starts without errors
- [ ] Can access login page
- [ ] Database file exists
- [ ] Can create/login users
- [ ] Dashboard loads correctly
- [ ] SMS sending interface accessible

## 🎉 You're All Set!

Your SMS Blast Desktop application is now installed and ready to use.

**Next Steps:**
1. Launch the application: `npm start`
2. Login or create an admin account
3. Configure your SMS settings
4. Start sending bulk messages!

---

**Need Help?** Review the troubleshooting section or check the main README.md

**Version:** 1.0.0  
**Last Updated:** April 2026
