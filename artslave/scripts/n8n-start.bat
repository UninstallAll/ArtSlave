@echo off
title n8n for ArtSlave

cd /d "%~dp0..\n8n"
if not exist "%CD%" mkdir "%CD%"

set N8N_PORT=5678
set N8N_USER_FOLDER=%CD%

echo Starting n8n on port 5678...
echo Please wait, first run may take several minutes.
echo.

npx n8n@latest start

pause
