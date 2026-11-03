@echo off
TITLE WhatsApp Automation - Local Dev Launcher
echo ========================================================
echo  Starting WhatsApp Automation (Local Development Mode)
echo  Cloud setup remains completely untouched!
echo ========================================================
echo.
echo Starting Backend on http://localhost:5000 ...
start "WA Backend (5000)" cmd /k "cd /d %~dp0backend & npm run dev"

timeout /t 2 /nobreak >nul

echo Starting Frontend on http://localhost:5173 ...
start "WA Frontend (5173)" cmd /k "cd /d %~dp0frontend & npm run dev"

echo.
echo ========================================================
echo  Local Services Launched:
echo   - WhatsApp Backend:  http://localhost:5000
echo   - WhatsApp Frontend: http://localhost:5173
echo   - Connected HQ:      http://127.0.0.1:5050
echo ========================================================
pause
