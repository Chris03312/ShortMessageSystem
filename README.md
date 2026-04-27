# 📱 SMS Blast - Centralized Bulk SMS Management System

> A powerful, centralized SMS broadcasting system with role-based access control and real-time queue management.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Electron](https://img.shields.io/badge/Electron-v41.3.0-blue)](https://www.electronjs.org/)

---

## 🌟 Features

### 🎯 Core Functionality
- **Bulk SMS Broadcasting** - Send SMS to thousands of recipients
- **Queue Management** - Smart queuing system with configurable delays
- **Real-time Processing** - Live status updates and progress tracking
- **Gateway Integration** - Connect to any SMS gateway API
- **Message Templates** - Save and reuse common messages

### 🔐 Security & Access Control
- **Role-Based Access** - Admin and Agent user types
- **Admin Web Portal** - Full system management via web browser
- **Agent Desktop App** - Secure client application for agents
- **Access Restriction** - Agents blocked from web access, must use desktop app
- **Session Management** - Secure authentication and session handling

### 📊 Administration
- **User Management** - Add, edit, and manage users
- **Activity Logs** - Comprehensive logging of all SMS operations
- **Statistics Dashboard** - Real-time analytics and reporting
- **Phone Number Management** - Manage sender phone numbers
- **Gateway Configuration** - Easy gateway setup and testing

### 🏗️ Architecture
- **Client-Server Model** - Centralized server with multiple clients
- **Desktop App** - Electron-based cross-platform application
- **RESTful API** - Clean API architecture
- **SQLite Database** - Lightweight, zero-configuration database
- **Environment-Based Config** - Flexible `.env` configuration

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18 or higher
- **npm** v8 or higher
- **Windows 10/11**, **macOS**, or **Linux**

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/sms-blast.git
cd sms-blast

# Install dependencies
npm install
```

### Configuration

1. **Create `.env` file:**
```bash
cp .env.example .env
```

2. **Edit `.env` with your settings:**
```env
# Server Configuration
SERVER_IP=192.168.1.100    # Your server's IP address
SERVER_PORT=3001            # Server port
NODE_ENV=production         # Environment (development/production)

# CORS Settings
ALLOWED_ORIGIN=*            # CORS origin (* for allow all)
```

3. **Start the server:**
```bash
npm run start:server
```

### Access the Application

**Web Interface (Admin Only):**
```
http://YOUR_SERVER_IP:3001
```

**Desktop App (Agents & Admins):**
```bash
npm start
```

---

## 📦 Building Desktop App

### Windows

```bash
npm run build:win
```
Output: `dist/SMS Blast Setup.exe`

### macOS

```bash
npm run build:mac
```
Output: `dist/SMS Blast.dmg`

### Linux

```bash
npm run build:linux
```
Output: `dist/SMS Blast.AppImage`

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         CENTRAL SERVER                   │
│      (192.168.x.x:3001)                 │
│                                          │
│  • SQLite Database                      │
│  • Express REST API                     │
│  • Queue Worker                         │
│  • Web Interface (Admin)                │
└────────┬──────────────────┬─────────────┘
         │                  │
    ┌────▼─────┐       ┌────▼──────────┐
    │ Web      │       │ Desktop Apps  │
    │ Browser  │       │ (Electron)    │
    │ (Admin)  │       │ (Agents)      │
    └──────────┘       └───────────────┘
```

### Technology Stack

**Backend:**
- Node.js + Express
- SQLite with sql.js
- Queue-based SMS processing
- RESTful API architecture

**Frontend:**
- Vanilla JavaScript (no frameworks)
- Modern CSS3
- Responsive design

**Desktop App:**
- Electron 41.3.0
- Client-only (connects to server)
- Cross-platform support

**Configuration:**
- dotenv for environment variables
- Dynamic config loading via API

---

## 🎯 User Roles

### 👑 Administrator
- ✅ Full system access
- ✅ Access via web browser
- ✅ Access via desktop app
- ✅ User management
- ✅ System configuration
- ✅ View all logs and statistics

### 👤 Agent
- ✅ SMS broadcasting only
- ❌ No web browser access
- ✅ Must use desktop app
- ✅ Limited to assigned features
- ✅ View own activity logs

---

## 📁 Project Structure

```
sms-blast/
├── .env                      # Server configuration (DO NOT COMMIT)
├── .env.example              # Configuration template
├── server-web.js             # Main server file
├── electron-main.js          # Electron desktop app
│
├── controllers/              # Business logic
│   ├── authController.js     # Authentication
│   ├── smsController.js      # SMS operations
│   ├── adminController.js    # Admin functions
│   ├── queueController.js    # Queue worker
│   └── userController.js     # User management
│
├── routes/                   # API routes
│   ├── authRoutes.js
│   ├── smsRoutes.js
│   ├── adminRoutes.js
│   └── userRoutes.js
│
├── models/                   # Database models
│   ├── authModel.js
│   ├── smsModel.js
│   └── adminModel.js
│
├── databases/                # Database files
│   ├── db.js                 # Database connection
│   └── init-db.js            # Database initialization
│
└── public/                   # Frontend files
    ├── javascript/
    │   ├── config.js         # Dynamic config loader
    │   ├── login.js          # Authentication
    │   ├── app.js            # Main app logic
    │   ├── admin.js          # Admin dashboard
    │   └── api.js            # API service layer
    ├── css/                  # Stylesheets
    └── *.html                # HTML pages
```

---

## 🔧 Configuration

### Environment Variables

All configuration is done via `.env` file:

```env
# Server Settings
SERVER_IP=192.168.1.100       # Server IP address
SERVER_PORT=3001               # Server port number
NODE_ENV=production            # Environment mode
ALLOWED_ORIGIN=*               # CORS allowed origins

# API Endpoints (relative paths)
ENDPOINT_SEND_SMS=/send-sms
ENDPOINT_CANCEL=/cancel-sms
ENDPOINT_CHECK_GATEWAY=/check-gateway
ENDPOINT_COUNT_LOGS=/countSentLogs
ENDPOINT_USERS=/users
ENDPOINT_LOGIN=/auth/login
ENDPOINT_SERVER_INFO=/server-info

# Storage Keys
STORAGE_KEY_ID=ID
STORAGE_KEY_NAME=NAME
STORAGE_KEY_NUMBER=NUMBER
STORAGE_KEY_FORM_DATA=bulkSmsFormData
STORAGE_KEY_CURRENT_USER=currentUser
```

### Dynamic Configuration

The system uses a **dynamic configuration** approach:

1. Server reads `.env` file on startup
2. Configuration served via `/api/config` endpoint
3. Frontend loads config dynamically (no hardcoded URLs)
4. Desktop app connects to configured server

**Benefits:**
- Change server IP without rebuilding
- Easy multi-environment deployment
- No hardcoded values in code
- Centralized configuration management

---

## 🔒 Security Features

### Authentication
- Secure password hashing (bcrypt)
- Session-based authentication
- Role-based access control (RBAC)

### Access Control
- Agents cannot access web interface
- Desktop app validates against server
- Admin-only routes protected

### Data Protection
- SQL injection prevention
- XSS protection
- CORS configuration
- Input validation and sanitization

---

## 📊 API Documentation

### Authentication

**POST** `/api/auth/login`
```json
{
  "userId": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "user_id": "string",
    "name": "string",
    "role": "admin|agent"
  }
}
```

### SMS Operations

**POST** `/api/send-sms`
```json
{
  "phone": "string",
  "message": "string",
  "gatewayUrl": "string",
  "gatewayToken": "string",
  "delayMs": 1000,
  "name": "string",
  "number": "string"
}
```

**POST** `/api/cancel-sms`
```json
{
  "userId": "string"
}
```

### Configuration

**GET** `/api/config`

Returns server configuration for dynamic client setup.

---

## 🚀 Deployment

### Production Server Setup

1. **Install on server:**
```bash
git clone https://github.com/yourusername/sms-blast.git
cd sms-blast
npm install --production
```

2. **Configure environment:**
```bash
cp .env.example .env
nano .env
```

3. **Run with PM2 (recommended):**
```bash
npm install -g pm2
pm2 start server-web.js --name sms-blast
pm2 save
pm2 startup
```

4. **Configure firewall:**
```bash
# Allow port 3001
sudo ufw allow 3001/tcp
```

### Desktop App Distribution

1. **Build installer:**
```bash
npm run build:win  # or build:mac / build:linux
```

2. **Distribute to users:**
- Share installer from `dist/` folder
- Users install and connect to central server

---

## 🧪 Testing

### Test Server
```bash
npm run start:server
```

### Test Desktop App
```bash
npm start
```

### Test Configuration
```bash
node test-config.js
```

### Access Points

- **Web Admin:** `http://localhost:3001`
- **API Config:** `http://localhost:3001/api/config`
- **Desktop App:** Launches Electron window

---

## 📖 Documentation

- **[COMPLETE-SETUP-GUIDE.md](COMPLETE-SETUP-GUIDE.md)** - Comprehensive setup instructions
- **[CONFIG-SETUP.md](CONFIG-SETUP.md)** - Configuration details
- **[INSTALLATION-GUIDE.md](INSTALLATION-GUIDE.md)** - Step-by-step installation
- **[QUICKSTART.md](QUICKSTART.md)** - Quick reference guide

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Coding Standards

- Use ES6+ JavaScript
- Follow existing code style
- Comment complex logic
- Test before submitting PR

---

## 🐛 Troubleshooting

### Common Issues

**Desktop app shows "Cannot Connect to Server"**
- Verify server is running
- Check `SERVER_IP` in `.env`
- Test: `curl http://SERVER_IP:3001/api/config`
- Check firewall settings

**Database errors on startup**
- Delete `.sqlite-shm` and `.sqlite-wal` files
- Check database file permissions
- Verify `databases/` folder exists

**Agents can access web interface**
- Clear browser cache
- Verify `login.js` has blocking code
- Check browser console for errors

See [COMPLETE-SETUP-GUIDE.md](COMPLETE-SETUP-GUIDE.md) for detailed troubleshooting.

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

---

## 🙏 Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- Uses [Express](https://expressjs.com/) for backend
- Database powered by [SQLite](https://www.sqlite.org/)
- Icons from [Lucide](https://lucide.dev/)

---

## 🗺️ Roadmap

- [ ] Multi-gateway support
- [ ] Scheduled SMS campaigns
- [ ] CSV import for contacts
- [ ] Message analytics and reporting
- [ ] SMS templates library
- [ ] Multi-language support
- [ ] Docker deployment
- [ ] API rate limiting
- [ ] Webhook integrations

---

## 📞 Support

For support, email your.email@example.com or open an issue on GitHub.

---

<div align="center">

**Made with ❤️ for efficient SMS broadcasting**

[⬆ back to top](#-sms-blast---centralized-bulk-sms-management-system)

</div>
