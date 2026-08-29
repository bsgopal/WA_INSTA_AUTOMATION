@echo off
echo ========================================
echo    RENIC AUTOMATION - Ngrok Check
echo ========================================
echo.

echo [1/3] Checking ngrok process...
tasklist | findstr /i "ngrok" >nul
if errorlevel 1 (
    echo ERROR: ngrok is NOT running!
    echo Start the Renic application - it will start ngrok automatically.
    goto :test_failed
)
echo SUCCESS: ngrok process is running!

echo.
echo [2/3] Checking ngrok tunnel via local API...
curl -s http://127.0.0.1:4040/api/tunnels | findstr "public_url" >nul
if errorlevel 1 (
    echo ERROR: ngrok is running but no active tunnel found!
    goto :test_failed
)
echo SUCCESS: ngrok tunnel is active!

echo.
echo [3/3] Getting tunnel URL...
for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "(Invoke-RestMethod http://127.0.0.1:4040/api/tunnels).tunnels[0].public_url"`) do set TUNNEL_URL=%%i
if defined TUNNEL_URL (
    echo SUCCESS: Public URL is: %TUNNEL_URL%
) else (
    echo NOTE: Could not read public URL (tunnel may still be starting)
)

echo.
echo ========================================
echo NGROK IS RUNNING! ✅
echo ========================================
echo ✅ ngrok: Process running
echo ✅ ngrok: Tunnel active
echo ✅ Ready for Renic Automation!
echo.
goto :end

:test_failed
echo.
echo ========================================
echo NGROK IS NOT RUNNING! ❌
echo ========================================
echo Start the Renic application - it will start ngrok automatically.
echo.

:end
pause