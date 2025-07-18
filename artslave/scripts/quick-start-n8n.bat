@echo off
title Quick Start n8n for ArtSlave

echo ========================================
echo Quick Start n8n for ArtSlave
echo ========================================
echo.

cd /d "%~dp0..\n8n"
if not exist "%CD%" mkdir "%CD%"

set N8N_PORT=5678
set N8N_USER_FOLDER=%CD%

echo Method 1: Using China mirror (recommended)
echo Command: npx --registry https://registry.npmmirror.com n8n@latest start
echo.
echo This will download and start n8n using a faster mirror.
echo Please be patient, first download may take 5-10 minutes.
echo.

choice /C YN /M "Start n8n now"

if errorlevel 2 goto :end
if errorlevel 1 goto :start

:start
echo.
echo Starting n8n...
echo.
npx --registry https://registry.npmmirror.com n8n@latest start

:end
echo.
echo If n8n started successfully, you can access it at:
echo http://localhost:5678
echo.
pause
