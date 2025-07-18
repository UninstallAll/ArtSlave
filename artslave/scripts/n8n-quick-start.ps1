Write-Host "=== ArtSlave n8n Quick Start ===" -ForegroundColor Green

# Check if n8n is already running
$n8nRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5678" -TimeoutSec 2 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "n8n is already running!" -ForegroundColor Green
        Write-Host "Access it at: http://localhost:5678" -ForegroundColor Cyan
        $n8nRunning = $true
    }
} catch {
    Write-Host "n8n is not running, starting it..." -ForegroundColor Yellow
}

if (-not $n8nRunning) {
    # Set up environment
    Set-Location "$PSScriptRoot\..\n8n"
    if (-not (Test-Path .)) {
        New-Item -ItemType Directory -Force | Out-Null
    }

    $env:N8N_PORT = "5678"
    $env:N8N_USER_FOLDER = $PWD

    # Check if n8n is installed globally
    try {
        $n8nVersion = n8n --version 2>$null
        if ($n8nVersion) {
            Write-Host "Starting n8n (version: $n8nVersion)..." -ForegroundColor Green
            n8n start
        } else {
            throw "n8n not found"
        }
    } catch {
        Write-Host "n8n not installed globally, checking Docker..." -ForegroundColor Yellow
        
        # Try Docker first
        try {
            docker version | Out-Null
            Write-Host "Using Docker to start n8n..." -ForegroundColor Green
            
            # Stop any existing container
            docker stop n8n-artslave 2>$null | Out-Null
            docker rm n8n-artslave 2>$null | Out-Null
            
            # Start new container
            docker run -d --name n8n-artslave -p 5678:5678 -v "${PWD}:/home/node/.n8n" n8nio/n8n
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "n8n started with Docker!" -ForegroundColor Green
                Write-Host "Waiting for n8n to be ready..." -ForegroundColor Yellow
                Start-Sleep -Seconds 10
            } else {
                throw "Docker failed"
            }
        } catch {
            Write-Host "Docker not available, using npx..." -ForegroundColor Yellow
            $env:NODE_TLS_REJECT_UNAUTHORIZED = "0"
            npm config set strict-ssl false
            npx --yes n8n@latest start
        }
    }
}

Write-Host "`nn8n should be available at: http://localhost:5678" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop n8n" -ForegroundColor Yellow
Read-Host "`nPress Enter to exit"
