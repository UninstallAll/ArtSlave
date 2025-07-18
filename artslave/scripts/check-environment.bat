@echo off
title Environment Check for ArtSlave n8n

echo ========================================
echo ArtSlave Environment Check
echo ========================================
echo.

echo Checking Node.js...
where node
if errorlevel 1 (
    echo [ERROR] Node.js not found in PATH
    echo.
    echo Please install Node.js:
    echo 1. Visit https://nodejs.org/
    echo 2. Download and install the LTS version
    echo 3. Restart your computer
    echo 4. Run this script again
    echo.
) else (
    echo [OK] Node.js found
    node --version
    echo.
)

echo Checking npm...
where npm
if errorlevel 1 (
    echo [ERROR] npm not found in PATH
    echo npm should be installed with Node.js
    echo.
) else (
    echo [OK] npm found
    npm --version
    echo.
)

echo Checking npx...
where npx
if errorlevel 1 (
    echo [ERROR] npx not found in PATH
    echo npx should be installed with Node.js
    echo.
) else (
    echo [OK] npx found
    npx --version
    echo.
)

echo Testing n8n availability...
npx n8n --version
if errorlevel 1 (
    echo [WARNING] n8n not available or first download needed
    echo This is normal for first run
    echo.
) else (
    echo [OK] n8n is available
    echo.
)

echo ========================================
echo Environment Check Complete
echo ========================================
echo.

pause
