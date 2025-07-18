@echo off
title n8n for ArtSlave (Europe)

cd /d "%~dp0..\n8n"
if not exist "%CD%" mkdir "%CD%"

set N8N_PORT=5678
set N8N_USER_FOLDER=%CD%

echo Starting n8n from Europe...
echo Using European npm registry for better connectivity.
echo.

REM 使用欧洲镜像或官方源
npx --registry https://registry.npmjs.org n8n@latest start

pause
