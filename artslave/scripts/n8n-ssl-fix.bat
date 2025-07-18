@echo off
title n8n for ArtSlave (SSL Fix)

cd /d "%~dp0..\n8n"
if not exist "%CD%" mkdir "%CD%"

set N8N_PORT=5678
set N8N_USER_FOLDER=%CD%

echo Starting n8n with SSL fixes for European networks...
echo.

REM 临时配置 npm 以解决 SSL 问题
echo Configuring npm for SSL compatibility...
npm config set fetch-retry-mintimeout 20000
npm config set fetch-retry-maxtimeout 120000
npm config set fetch-timeout 300000
npm config set maxsockets 1

echo.
echo Starting n8n...
echo This may take a few minutes on first run.
echo.

REM 使用官方源但增加重试和超时设置
npx n8n@latest start

REM 如果失败，尝试禁用严格SSL
if errorlevel 1 (
    echo.
    echo First attempt failed, trying with relaxed SSL settings...
    echo.
    npm config set strict-ssl false
    npx n8n@latest start
    
    REM 恢复SSL设置
    npm config set strict-ssl true
)

pause
