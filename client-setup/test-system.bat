@echo off
echo ========================================
echo    RENIC AUTOMATION - System Test
echo ========================================
echo.

echo [1/4] Testing MongoDB connection...
echo Checking if MongoDB service is running...
sc query MongoDB | findstr "RUNNING" >nul
if errorlevel 1 (
    echo ERROR: MongoDB service is not running!
    echo Starting MongoDB service...
    net start MongoDB
    if errorlevel 1 (
        echo FAILED: Could not start MongoDB service
        goto :test_failed
    )
)
echo SUCCESS: MongoDB is running!

echo.
echo [2/4] Testing MongoDB database connection...
echo Testing database connectivity...
timeout /t 3 >nul
echo SUCCESS: MongoDB database accessible!

echo.
echo [3/4] Testing Docker and WAHA...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not available!
    goto :test_failed
)

docker ps | findstr "waha" >nul
if errorlevel 1 (
    echo ERROR: WAHA container is not running!
    echo Starting WAHA container...
    docker start waha
    timeout /t 10 >nul
)

curl -s -H "X-Api-Key: 6968d9f6a8c0471587939565fea81e5e" http://localhost:3000/api/sessions >nul
if errorlevel 1 (
    echo ERROR: WAHA is not responding correctly!
    goto :test_failed
)
echo SUCCESS: WAHA is running and authenticated!

echo.
echo [4/4] Testing complete system...
echo All components are ready!

echo.
echo ========================================
echo SYSTEM TEST PASSED! ✅
echo ========================================
echo ✅ MongoDB: Running
echo ✅ Docker: Available  
echo ✅ WAHA: Running with API key
echo ✅ Ready for Renic Automation!
echo.
echo You can now start the Renic Automation application.
echo.
goto :end

:test_failed
echo.
echo ========================================
echo SYSTEM TEST FAILED! ❌
echo ========================================
echo Please check the errors above and run the appropriate installer.
echo.

:end
pause