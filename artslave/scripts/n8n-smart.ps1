Write-Host "=== ArtSlave n8n Smart Launcher ===" -ForegroundColor Green

# Check if Docker is available and running
Write-Host "Checking Docker availability..." -ForegroundColor Yellow
$dockerAvailable = $false

try {
    $dockerVersion = docker version --format json 2>$null | ConvertFrom-Json
    if ($dockerVersion) {
        Write-Host "Docker is running!" -ForegroundColor Green
        $dockerAvailable = $true
    }
} catch {
    Write-Host "Docker is not running or not available." -ForegroundColor Yellow
}

if ($dockerAvailable) {
    Write-Host "Using Docker method (most reliable)..." -ForegroundColor Green
    
    # Set up data directory
    $dataDir = "$PSScriptRoot\..\n8n"
    if (-not (Test-Path $dataDir)) {
        New-Item -ItemType Directory -Force -Path $dataDir | Out-Null
    }

    # Stop any existing container
    docker stop n8n-artslave 2>$null | Out-Null
    docker rm n8n-artslave 2>$null | Out-Null

    Write-Host "Starting n8n with Docker..." -ForegroundColor Cyan
    
    # Start n8n container
    docker run -d --name n8n-artslave -p 5678:5678 -v "${dataDir}:/home/node/.n8n" n8nio/n8n
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "n8n started successfully with Docker!" -ForegroundColor Green
        Write-Host "Access at: http://localhost:5678" -ForegroundColor Cyan
        
        # Wait for container to be ready
        Write-Host "Waiting for n8n to be ready..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
        
        # Check if accessible
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:5678" -TimeoutSec 5 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Host "n8n is ready and accessible!" -ForegroundColor Green
            }
        } catch {
            Write-Host "n8n is starting up, please wait a moment..." -ForegroundColor Yellow
        }
    } else {
        Write-Host "Docker method failed, trying npm method..." -ForegroundColor Yellow
        $dockerAvailable = $false
    }
}

if (-not $dockerAvailable) {
    Write-Host "Using npm method with SSL fixes..." -ForegroundColor Yellow

    Set-Location "$PSScriptRoot\..\n8n"
    if (-not (Test-Path .)) {
        New-Item -ItemType Directory -Force | Out-Null
    }

    $env:N8N_PORT = "5678"
    $env:N8N_USER_FOLDER = $PWD
    $env:NODE_TLS_REJECT_UNAUTHORIZED = "0"

    # Check if n8n is already installed globally
    Write-Host "Checking if n8n is already installed..." -ForegroundColor Cyan
    $n8nInstalled = $false

    try {
        $n8nVersion = n8n --version 2>$null
        if ($n8nVersion) {
            Write-Host "n8n is already installed (version: $n8nVersion)" -ForegroundColor Green
            $n8nInstalled = $true
        }
    } catch {
        Write-Host "n8n not found globally, checking local installation..." -ForegroundColor Yellow
    }

    if (-not $n8nInstalled) {
        Write-Host "Configuring npm for SSL bypass..." -ForegroundColor Cyan
        npm config set registry "http://registry.npmjs.org/"
        npm config set strict-ssl false
        npm config set ca ""
        npm config set fetch-timeout 600000

        Write-Host "Installing n8n globally (first time only)..." -ForegroundColor Cyan
        npm install -g n8n --registry http://registry.npmjs.org/ --no-optional

        if ($LASTEXITCODE -eq 0) {
            Write-Host "n8n installed successfully!" -ForegroundColor Green
            $n8nInstalled = $true
        } else {
            Write-Host "Global install failed, will use npx method..." -ForegroundColor Yellow
        }
    }

    if ($n8nInstalled) {
        Write-Host "Starting n8n (already installed)..." -ForegroundColor Green
        n8n start
    } else {
        Write-Host "Using npx method (will download if needed)..." -ForegroundColor Yellow
        npx --yes n8n@latest start
    }
}

Write-Host "`nIf successful, n8n is available at: http://localhost:5678" -ForegroundColor Green
Read-Host "Press Enter to exit"
