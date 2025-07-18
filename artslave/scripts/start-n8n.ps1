Write-Host "Starting n8n for ArtSlave..." -ForegroundColor Green

Set-Location "$PSScriptRoot\..\n8n"

if (-not (Test-Path .)) {
    New-Item -ItemType Directory -Force
}

$env:N8N_PORT = "5678"
$env:N8N_USER_FOLDER = $PWD

Write-Host "Configuring npm..." -ForegroundColor Yellow
npm config set strict-ssl false
npm config set registry "http://registry.npmjs.org/"

Write-Host "Starting n8n..." -ForegroundColor Yellow
Write-Host "This may take several minutes on first run." -ForegroundColor Cyan

npx n8n@latest start

Read-Host "Press Enter to exit"
