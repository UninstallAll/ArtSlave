@echo off
title n8n for ArtSlave (Network Fix)

cd /d "%~dp0..\n8n"
if not exist "%CD%" mkdir "%CD%"

set N8N_PORT=5678
set N8N_USER_FOLDER=%CD%

echo Starting n8n on port 5678...
echo Applying network fixes for SSL issues...
echo.

REM 设置 npm 配置以解决 SSL 问题
npm config set registry https://registry.npmmirror.com
npm config set strict-ssl false
npm config set fetch-retry-mintimeout 20000
npm config set fetch-retry-maxtimeout 120000
npm config set fetch-timeout 300000

echo Using China npm mirror for better connectivity...
echo.

REM 尝试启动 n8n
npx n8n@latest start

REM 如果失败，尝试其他方法
if errorlevel 1 (
    echo.
    echo First attempt failed, trying alternative method...
    echo.
    
    REM 尝试使用 cnpm
    echo Installing cnpm...
    npm install -g cnpm --registry=https://registry.npmmirror.com
    
    if not errorlevel 1 (
        echo Using cnpm to install n8n...
        cnpm install -g n8n
        
        if not errorlevel 1 (
            echo Starting n8n with cnpm installation...
            n8n start
        )
    )
)

pause
