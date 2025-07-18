Write-Host "=== ArtSlave n8n Docker Launcher ===" -ForegroundColor Green
Write-Host "Using Docker for reliable n8n deployment..." -ForegroundColor Yellow

# Set up data directory
$dataDir = "$PSScriptRoot\..\n8n"
if (-not (Test-Path $dataDir)) {
    New-Item -ItemType Directory -Force -Path $dataDir | Out-Null
}

Write-Host "Data directory: $dataDir" -ForegroundColor Cyan

# Stop any existing n8n container
Write-Host "Stopping any existing n8n container..." -ForegroundColor Yellow
docker stop n8n-artslave 2>$null
docker rm n8n-artslave 2>$null

Write-Host "Starting n8n with Docker..." -ForegroundColor Green
Write-Host "This will download n8n Docker image if not present..." -ForegroundColor Cyan

# Start n8n container
docker run -d `
  --name n8n-artslave `
  -p 5678:5678 `
  -v "${dataDir}:/home/node/.n8n" `
  -e N8N_HOST=0.0.0.0 `
  -e N8N_PORT=5678 `
  -e N8N_PROTOCOL=http `
  n8nio/n8n

if ($LASTEXITCODE -eq 0) {
    Write-Host "n8n started successfully!" -ForegroundColor Green
    Write-Host "Access n8n at: http://localhost:5678" -ForegroundColor Cyan
    Write-Host "Container name: n8n-artslave" -ForegroundColor Yellow
    
    # Wait a moment for container to start
    Start-Sleep -Seconds 3
    
    # Check if container is running
    $status = docker ps --filter "name=n8n-artslave" --format "{{.Status}}"
    if ($status) {
        Write-Host "Container status: $status" -ForegroundColor Green
        Write-Host "`nn8n is ready! You can now:" -ForegroundColor White
        Write-Host "1. Access http://localhost:5678 in your browser" -ForegroundColor White
        Write-Host "2. Click 'Open n8n' button in ArtSlave" -ForegroundColor White
        Write-Host "`nTo stop n8n later, run: docker stop n8n-artslave" -ForegroundColor Yellow
    } else {
        Write-Host "Container may still be starting up..." -ForegroundColor Yellow
    }
} else {
    Write-Host "Failed to start n8n container!" -ForegroundColor Red
    Write-Host "Please check Docker is running and try again." -ForegroundColor Yellow
}

Read-Host "`nPress Enter to exit"
