@echo off
echo ========================================
echo ArtSlave n8n Launcher (Legacy)
echo ========================================
echo.
echo This batch file is now deprecated.
echo Using the new PowerShell script for better reliability...
echo.

REM Call the new PowerShell script
powershell -ExecutionPolicy Bypass -File "%~dp0n8n-quick-start.ps1"

if errorlevel 1 (
    echo.
    echo PowerShell script failed. Trying basic method...
    echo.
    cd /d "%~dp0..\n8n"
    if not exist "%CD%" mkdir "%CD%"
    set N8N_PORT=5678
    set N8N_USER_FOLDER=%CD%
    npx n8n@latest start
)

pause
