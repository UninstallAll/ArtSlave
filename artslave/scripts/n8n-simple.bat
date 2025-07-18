@echo off
title n8n Simple Start

cd /d "%~dp0.."
cd n8n
if not exist "%CD%" mkdir "%CD%"

set N8N_PORT=5678
set N8N_USER_FOLDER=%CD%

echo Starting n8n...
echo.

npm config set strict-ssl false
npm config set registry http://registry.npmjs.org/

npx n8n@latest start

pause
