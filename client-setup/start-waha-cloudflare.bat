@echo off
TITLE WAHA Docker ^& Cloudflare Tunnel Launcher
color 0b
echo ========================================================================
echo       WAHA (WhatsApp Docker) + Cloudflare Tunnel Launcher
echo ========================================================================
echo.

:: 1. Check & Start Docker Desktop
echo [1/3] Checking Docker status...
docker info >nul 2>&1
if errorlevel 1 (
    echo [i] Docker is not running. Attempting to start Docker Desktop...
    if exist "%LOCALAPPDATA%\Programs\DockerDesktop\Docker Desktop.exe" (
        start "" "%LOCALAPPDATA%\Programs\DockerDesktop\Docker Desktop.exe"
    ) else if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" (
        start "" "%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
    ) else (
        echo [ERROR] Docker Desktop executable not found! Please open Docker manually.
        pause
        exit /b 1
    )

    echo [i] Waiting for Docker daemon to initialize...
    :wait_docker
    timeout /t 4 /nobreak >nul
    docker info >nul 2>&1
    if errorlevel 1 (
        echo     Still waiting for Docker...
        goto wait_docker
    )
)
echo [OK] Docker daemon is running!
echo.

:: 2. Start or Create WAHA Container
echo [2/3] Starting WAHA WhatsApp Docker container...
docker start waha >nul 2>&1
if errorlevel 1 (
    echo [i] WAHA container not found or stopped. Creating 'waha' container...
    docker run -d --name waha -p 3000:3000 -e WAHA_API_KEY=6968d9f6a8c0471587939565fea81e5e -v waha_sessions:/app/.waha_sessions --restart unless-stopped devlikeapro/waha
    if errorlevel 1 (
        echo [ERROR] Failed to run Docker container. Check Docker Desktop permissions.
        pause
        exit /b 1
    )
)
echo [OK] WAHA container running on http://127.0.0.1:3000
echo.

:: 3. Start Cloudflare Tunnel
echo [3/3] Starting Cloudflare Tunnel for WAHA (port 3000)...
echo ========================================================================
echo  LOOK BELOW FOR YOUR PUBLIC CLOUDFLARE URL:
echo  Copy: https://xxxxxxxx.trycloudflare.com
echo  Paste into:
echo   - App Settings: "Gateway API URL" (in WhatsApp tab)
echo   - OR Vercel Environment Variables: WAHA_API_URL
echo ========================================================================
echo.

where cloudflared >nul 2>&1
if not errorlevel 1 (
    cloudflared tunnel --url http://127.0.0.1:3000
) else if exist "%ProgramFiles(x86)%\cloudflared\cloudflared.exe" (
    "%ProgramFiles(x86)%\cloudflared\cloudflared.exe" tunnel --url http://127.0.0.1:3000
) else if exist "%~dp0..\..\cloudflared.exe" (
    "%~dp0..\..\cloudflared.exe" tunnel --url http://127.0.0.1:3000
) else (
    echo [ERROR] cloudflared.exe was not found.
    pause
    exit /b 1
)

pause
