@echo off
cd /d %~dp0..
cd n8n
npm config set strict-ssl false
npx n8n@latest start
pause
