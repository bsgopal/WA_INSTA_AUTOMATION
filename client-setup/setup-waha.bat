@echo off
echo ========================================
echo    RENIC AUTOMATION - WAHA Setup
echo ========================================
echo.

echo [1/4] Checking Docker status...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not installed or not running!
    echo Please install Docker Desktop first using install-docker.bat
    pause
    exit /b 1
)

echo Docker is available!
echo.

echo [2/4] Pulling WAHA Docker image...
docker pull devlikeapro/waha

echo.
echo [3/4] Stopping any existing WAHA container...
docker stop waha >nul 2>&1
docker rm waha >nul 2>&1

echo.
echo [4/4] Starting WAHA with API key...
docker run -d ^
  --name waha ^
  -p 3000:3000 ^
  -e WAHA_API_KEY=6968d9f6a8c0471587939565fea81e5e ^
  --restart unless-stopped ^
  devlikeapro/waha

echo.
echo Testing WAHA connection...
timeout /t 10 >nul
curl -s -H "X-Api-Key: 6968d9f6a8c0471587939565fea81e5e" http://localhost:3000/api/sessions >nul
if errorlevel 1 (
    echo WARNING: WAHA might still be starting up...
) else (
    echo SUCCESS: WAHA is running and accessible!
)

echo.
echo ========================================
echo WAHA setup completed!
echo ========================================
echo WAHA is running on: http://localhost:3000
echo API Key: 6968d9f6a8c0471587939565fea81e5e
echo Container will auto-restart on system reboot.
echo.
pause