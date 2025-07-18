@echo off
title n8n for ArtSlave (China Mirror)

cd /d "%~dp0..\n8n"
if not exist "%CD%" mkdir "%CD%"

set N8N_PORT=5678
set N8N_USER_FOLDER=%CD%

echo Starting n8n using China mirror...
echo This should resolve SSL connection issues.
echo.

REM 使用淘宝镜像启动 n8n
npx --registry https://registry.npmmirror.com n8n@latest start

pause
