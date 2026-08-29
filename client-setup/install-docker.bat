@echo off
echo ========================================
echo    RENIC AUTOMATION - Docker Setup
echo ========================================
echo.

echo [1/3] Downloading Docker Desktop...
if not exist "DockerDesktopInstaller.exe" (
    echo Downloading Docker Desktop installer...
    curl -o DockerDesktopInstaller.exe "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
)

echo.
echo [2/3] Installing Docker Desktop...
echo Please follow the installation wizard...
echo - Use WSL 2 instead of Hyper-V: YES (recommended)
echo - Add shortcut to desktop: YES
echo.
start /wait DockerDesktopInstaller.exe install --quiet

echo.
echo [3/3] Starting Docker Desktop...
echo Please wait for Docker to start completely...
start "Docker Desktop" "C:\Program Files\Docker\Docker\Docker Desktop.exe"

echo.
echo ========================================
echo Docker installation completed!
echo ========================================
echo Please restart your computer, then run setup-waha.bat
echo.
pause