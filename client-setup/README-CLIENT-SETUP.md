# 🚀 RENIC AUTOMATION - Client Installation Guide

## 📦 Complete Local Setup Package

This package contains everything needed to run Renic Automation completely offline on the client's laptop.

## 🔧 Installation Steps

### Step 1: Install MongoDB (Database)
```cmd
1. Run as Administrator: install-mongodb.bat
2. Follow installation wizard (choose "Complete")
3. Wait for installation to complete
```

### Step 2: Install Docker (For WAHA WhatsApp)
```cmd
1. Run as Administrator: install-docker.bat  
2. Follow installation wizard
3. Restart computer when prompted
```

### Step 3: Setup WAHA (WhatsApp Service)
```cmd
1. After restart, run: setup-waha.bat
2. Wait for Docker image download and setup
3. WAHA will be ready with API key configured
```

### Step 4: Test System
```cmd
1. Run: test-system.bat
2. Verify all components are working
3. Should show "SYSTEM TEST PASSED! ✅"
```

### Step 5: Deploy Application
```cmd
1. Copy the Renic Automation EXE to client laptop
2. Run the EXE - it will connect to local services
3. Complete setup in the application UI
```

## 🔧 What Gets Installed Locally:

- **MongoDB**: Local database (port 27017)
- **Docker Desktop**: Container platform  
- **WAHA Container**: WhatsApp API (port 3000)
- **Renic Application**: Your EXE file

## 📊 Data Storage:

- **All data stored locally** on client laptop
- **No internet required** for operation (except WhatsApp)
- **Full offline functionality**

## 🆘 Troubleshooting:

### MongoDB Issues:
```cmd
# Check service status
sc query MongoDB

# Start manually
net start MongoDB
```

### Docker Issues:
```cmd
# Check Docker status  
docker --version
docker ps

# Restart WAHA
docker restart waha
```

### WAHA Issues:
```cmd
# Check WAHA status
curl -H "X-Api-Key: 6968d9f6a8c0471587939565fea81e5e" http://localhost:3000/api/sessions

# View logs
docker logs waha
```

## 📋 System Requirements:

- **Windows 10/11** (64-bit)
- **8GB RAM** minimum (16GB recommended)
- **10GB free disk space** minimum
- **Internet connection** for initial setup only

## 🔑 Important Notes:

- **WAHA API Key**: `6968d9f6a8c0471587939565fea81e5e`
- **MongoDB**: Runs on localhost:27017
- **WAHA**: Runs on localhost:3000
- **Application**: Connects to local services

## ✅ Success Indicators:

- MongoDB service shows "RUNNING"
- Docker Desktop icon in system tray
- WAHA responds with 200 (not 401 error)
- Application starts and shows login page

---

**Support**: If you encounter issues, run `test-system.bat` to diagnose problems.