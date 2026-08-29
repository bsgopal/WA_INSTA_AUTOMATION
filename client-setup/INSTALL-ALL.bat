@echo off
setlocal EnableDelayedExpansion

echo ========================================
echo    RENIC AUTOMATION - Complete Setup
echo ========================================
echo.
echo This will install everything needed for Renic Automation:
echo - MongoDB (Local Database)
echo - Docker Desktop (Container Platform)
echo - WAHA (WhatsApp Service)
echo.
echo IMPORTANT: This requires Administrator privileges!
echo.
pause

:: Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Running as Administrator
) else (
    echo ❌ ERROR: This script must be run as Administrator!
    echo Right-click this file and select "Run as administrator"
    pause
    exit /b 1
)

echo.
echo ========================================
echo [PHASE 1] Installing MongoDB...
echo ========================================
call install-mongodb.bat

echo.
echo ========================================
echo [PHASE 2] Installing Docker Desktop...
echo ========================================
call install-docker.bat

echo.
echo ========================================
echo Installation Phase Complete!
echo ========================================
echo.
echo IMPORTANT: Please restart your computer now.
echo After restart, run "SETUP-SERVICES.bat" to complete setup.
echo.
echo Create desktop shortcut? (Y/N)
set /p create_shortcut=
if /i "!create_shortcut!"=="Y" (
    echo Creating desktop shortcuts...
    copy "SETUP-SERVICES.bat" "%USERPROFILE%\Desktop\Renic-Setup-Services.bat" >nul
    copy "test-system.bat" "%USERPROFILE%\Desktop\Renic-Test-System.bat" >nul
    echo ✅ Shortcuts created on desktop
)

echo.
echo ========================================
echo READY FOR RESTART
echo ========================================
echo 1. Restart your computer
echo 2. Run "Renic-Setup-Services.bat" from desktop
echo 3. Run your Renic Automation EXE
echo.
pause