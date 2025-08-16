@echo off
title Smart n8n Launcher - ArtSlave
color 0A

echo ========================================
echo   Smart n8n Launcher - ArtSlave
echo ========================================
echo.
echo Checking system environment and choosing best method...
echo.

REM Check if n8n is already running
echo [1/5] Checking if n8n is already running...
netstat -ano | findstr :5678 >nul 2>&1
if %errorlevel%==0 (
    echo ✅ n8n is already running on port 5678!
    echo Opening browser...
    start http://localhost:5678
    goto :end
)
echo ❌ n8n is not running, will start it.
echo.

REM Check Docker installation
echo [2/5] Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Docker is installed
    goto :check_docker_running
) else (
    echo ❌ Docker is not installed
    goto :use_npx_method
)

:check_docker_running
echo [3/5] Checking Docker service status...
docker info >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Docker is running
    goto :use_docker_method
) else (
    echo ❌ Docker is not running, trying to start...
    echo Starting Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo Waiting for Docker to start (60 seconds)...
    timeout /t 60 /nobreak >nul
    
    REM Check again after waiting
    docker info >nul 2>&1
    if %errorlevel%==0 (
        echo ✅ Docker started successfully
        goto :use_docker_method
    ) else (
        echo ❌ Docker failed to start, falling back to npx method
        goto :use_npx_method
    )
)

:use_docker_method
echo [4/5] Using Docker method (recommended)...
echo.
echo Removing any existing n8n container...
docker rm -f n8n >nul 2>&1

echo Starting n8n with Docker...
echo Command: docker run --name n8n -p 5678:5678 -d n8nio/n8n
docker run --name n8n -p 5678:5678 -d n8nio/n8n

if %errorlevel%==0 (
    echo ✅ n8n Docker container started successfully!
    echo Waiting for n8n to initialize (30 seconds)...
    timeout /t 30 /nobreak >nul
    goto :test_connection
) else (
    echo ❌ Docker method failed, falling back to npx
    goto :use_npx_method
)

:use_npx_method
echo [4/5] Using npx method (fallback)...
echo.
cd /d "%~dp0..\n8n-temp"
if not exist "%CD%" mkdir "%CD%"

echo Creating database config...
echo {"database": {"type": "sqlite", "database": "database.sqlite"}} > config.json

echo Setting environment variables...
set N8N_CONFIG_FILES=config.json
set N8N_USER_FOLDER=%CD%

echo Starting n8n with npx...
echo This will run in foreground - DO NOT CLOSE THIS WINDOW
echo.
start /min npx --registry https://registry.npmmirror.com n8n@latest start

echo Waiting for n8n to start (45 seconds)...
timeout /t 45 /nobreak >nul
goto :test_connection

:test_connection
echo [5/5] Testing n8n connection...
echo.

REM Test connection multiple times
for /L %%i in (1,1,10) do (
    echo Testing connection attempt %%i/10...
    curl -s -o nul -w "%%{http_code}" http://localhost:5678 | findstr "200" >nul 2>&1
    if %errorlevel%==0 (
        echo ✅ n8n is responding successfully!
        echo.
        echo 🚀 n8n is now available at: http://localhost:5678
        echo Opening browser...
        start http://localhost:5678
        echo.
        echo 📋 Next steps:
        echo 1. Create admin account on first visit
        echo 2. Import ArtSlave workflows from n8n/workflows/
        echo 3. Configure API endpoints to connect with ArtSlave
        goto :end
    )
    timeout /t 3 /nobreak >nul
)

echo ❌ Connection test failed after 10 attempts
echo Please check the logs and try manual startup
echo.

:end
echo.
echo Press any key to exit...
pause >nul 