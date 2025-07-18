@echo off
title n8n Ultimate Fix for Germany

cd /d "%~dp0..\n8n"
if not exist "%CD%" mkdir "%CD%"

set N8N_PORT=5678
set N8N_USER_FOLDER=%CD%

echo ========================================
echo n8n Ultimate Fix for Germany
echo ========================================
echo.

echo Step 1: Clearing npm cache...
npm cache clean --force

echo.
echo Step 2: Configuring npm for SSL issues...
npm config set strict-ssl false
npm config set registry http://registry.npmjs.org/
npm config set fetch-retry-mintimeout 20000
npm config set fetch-retry-maxtimeout 120000
npm config set fetch-timeout 600000
npm config set maxsockets 1

echo.
echo Step 3: Attempting to install n8n globally...
npm install -g n8n --no-optional

if errorlevel 1 (
    echo.
    echo Global install failed, trying alternative methods...
    echo.
    
    echo Method 2: Using yarn...
    where yarn >nul 2>&1
    if not errorlevel 1 (
        yarn global add n8n
        if not errorlevel 1 (
            echo Starting n8n with yarn installation...
            n8n start
            goto :end
        )
    ) else (
        echo Installing yarn...
        npm install -g yarn --no-optional
        if not errorlevel 1 (
            yarn global add n8n
            if not errorlevel 1 (
                echo Starting n8n with yarn installation...
                n8n start
                goto :end
            )
        )
    )
    
    echo.
    echo Method 3: Direct download and run...
    echo This may take longer but should work...
    
    REM 尝试使用 HTTP 而不是 HTTPS
    npm config set registry http://registry.npmjs.org/
    npx n8n@latest start
    
) else (
    echo.
    echo Global install successful! Starting n8n...
    n8n start
)

:end
echo.
echo Restoring npm settings...
npm config delete strict-ssl
npm config delete registry
npm config delete fetch-retry-mintimeout
npm config delete fetch-retry-maxtimeout
npm config delete fetch-timeout
npm config delete maxsockets

echo.
echo If n8n started successfully, access it at: http://localhost:5678
pause
