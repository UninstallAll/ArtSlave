@echo off
title ArtSlave n8n Launcher

echo Starting n8n for ArtSlave...
echo.

REM Check if Node.js is available
where node >nul 2>&1
if errorlevel 1 (
    echo Node.js not found. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Set working directory
cd /d "%~dp0..\n8n"
if not exist "%CD%" mkdir "%CD%"

REM Set environment variables
set N8N_PORT=5678
set N8N_HOST=0.0.0.0
set N8N_USER_FOLDER=%CD%

echo Working directory: %CD%
echo Port: %N8N_PORT%
echo.
echo Downloading and starting n8n...
echo This may take a few minutes on first run.
echo.

REM Start n8n
npx n8n@latest start

REM Keep window open if there's an error
if errorlevel 1 (
    echo.
    echo n8n failed to start.
    echo Try running: npx n8n@latest start
    echo.
    pause
)
