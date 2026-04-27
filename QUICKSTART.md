# SMS Blast Desktop - Quick Start Guide

## Installation Steps

### For Windows:
1. Double-click `install-desktop.bat`
2. Wait for installation to complete
3. Run `npm start` to launch the application

### For macOS/Linux:
1. Open terminal in this directory
2. Run `./install-desktop.sh`
3. Run `npm start` to launch the application

## What Gets Installed

The installer will:
- ✅ Backup your original package.json (to package-web.json)
- ✅ Install Electron and all required dependencies
- ✅ Set up the desktop application

## Running the Application

### Desktop Mode (Recommended)
```bash
npm start
```
This launches the full desktop application with a native window.

### Development Mode
```bash
npm run dev
```
Opens with Chrome DevTools for debugging.

### Web Server Mode
```bash
npm run start:web
```
Runs as a traditional web server on http://localhost:3001

## Building Executables

### Windows Installer (.exe)
```bash
npm run build:win
```
Creates: `dist/SMS Blast Desktop Setup.exe`

### macOS App (.dmg)
```bash
npm run build:mac
```
Creates: `dist/SMS Blast Desktop.dmg`

### Linux Package (.AppImage, .deb)
```bash
npm run build:linux
```
Creates: `dist/SMS Blast Desktop.AppImage` and `.deb`

## Features

✨ **Desktop Application**
- Native window with system tray
- Auto-starts local server
- Better performance
- Standalone executable

🌐 **Web Server Mode**
- Traditional browser access
- Network accessible
- Multi-user capable

## Troubleshooting

**Problem: Port 3001 already in use**
- Solution: Change PORT in .env file or stop other applications

**Problem: npm command not found**
- Solution: Install Node.js from https://nodejs.org/

**Problem: Permission denied (Linux/Mac)**
- Solution: Run `chmod +x install-desktop.sh`

**Problem: Can't build for Mac on Windows**
- Solution: Cross-platform building has limitations. Build on the target OS.

## File Locations

- **Application**: Current directory
- **Database**: `databases/agent-sms.sqlite`
- **Logs**: `public/logs/`
- **Built Apps**: `dist/`

## Switching Back to Web Mode

To revert to web-only mode:
```bash
cp package-web.json package.json
npm install
npm start
```

## Support

For issues:
1. Check the console output for errors
2. Verify Node.js is version 16 or higher
3. Delete node_modules and run `npm install` again

## System Requirements

- **OS**: Windows 10/11, macOS 10.13+, or Linux
- **Node.js**: v16 or higher
- **RAM**: 512MB minimum
- **Disk**: 200MB for application + dependencies

---

Enjoy using SMS Blast Desktop! 🚀
