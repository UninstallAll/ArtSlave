@echo off
title n8n Successful Launcher - ArtSlave
color 0A

echo ========================================
echo   n8n Successful Launcher - ArtSlave
echo ========================================
echo.
echo This script will start n8n using the tested method.
echo.

cd /d "%~dp0..\artslave\n8n-temp"
if not exist "%CD%" mkdir "%CD%"

echo Creating simple database config...
echo {"database": {"type": "sqlite", "database": "database.sqlite"}} > config.json

echo.
echo Setting up environment...
set N8N_CONFIG_FILES=config.json
set N8N_USER_FOLDER=%CD%

echo.
echo Starting n8n...
echo Please wait for "Editor is now accessible" message.
echo.
echo n8n will be available at: http://localhost:5678
echo.

npx --registry https://registry.npmmirror.com n8n@latest start

pause 