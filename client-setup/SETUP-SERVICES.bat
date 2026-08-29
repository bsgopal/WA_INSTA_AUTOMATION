@echo off
echo ========================================
echo    RENIC AUTOMATION - Services Setup  
echo    (Run this AFTER restart)
echo ========================================
echo.

echo [1/3] Starting MongoDB service...
net start MongoDB
if errorlevel 1 (
    echo Trying alternative start method...
    sc start MongoDB
)

echo.
echo [2/3] Setting up WAHA (WhatsApp service)...
call setup-waha.bat

echo.
echo [3/3] Running system test...
call test-system.bat

echo.
echo ========================================
echo SETUP COMPLETE!
echo ========================================
echo Your Renic Automation system is ready to use.
echo You can now run the Renic Automation EXE file.
echo.
pause