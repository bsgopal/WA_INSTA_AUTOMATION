@echo off
echo ========================================
echo    RENIC AUTOMATION - MongoDB Setup
echo ========================================
echo.

echo [1/4] Downloading MongoDB...
if not exist "mongodb-windows-x86_64-7.0.4.msi" (
    echo Downloading MongoDB installer...
    curl -o mongodb-windows-x86_64-7.0.4.msi "https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-7.0.4.msi"
)

echo.
echo [2/4] Installing MongoDB...
echo Please follow the installation wizard...
echo - Choose "Complete" installation
echo - Install MongoDB as a Service: YES
echo - Install MongoDB Compass: YES (optional)
echo.
start /wait mongodb-windows-x86_64-7.0.4.msi

echo.
echo [3/4] Creating MongoDB data directory...
if not exist "C:\data\db" mkdir "C:\data\db"

echo.
echo [4/4] Starting MongoDB service...
net start MongoDB
sc config MongoDB start= auto

echo.
echo ========================================
echo MongoDB installation completed!
echo ========================================
echo MongoDB service is running and will start automatically on boot.
echo.
pause