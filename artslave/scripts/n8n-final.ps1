Write-Host "=== ArtSlave n8n Launcher ===" -ForegroundColor Green
Write-Host "Solving SSL issues for German network..." -ForegroundColor Yellow

Set-Location "$PSScriptRoot\..\n8n"

if (-not (Test-Path .)) {
    New-Item -ItemType Directory -Force | Out-Null
}

$env:N8N_PORT = "5678"
$env:N8N_USER_FOLDER = $PWD

Write-Host "Step 1: Clearing npm cache..." -ForegroundColor Cyan
npm cache clean --force 2>$null

Write-Host "Step 2: Configuring npm for SSL bypass..." -ForegroundColor Cyan
npm config set registry "http://registry.npmjs.org/"
npm config set strict-ssl false
npm config set fetch-retry-mintimeout 20000
npm config set fetch-retry-maxtimeout 120000
npm config set fetch-timeout 600000

Write-Host "Step 3: Installing n8n globally to avoid npx issues..." -ForegroundColor Cyan
npm install -g n8n --no-optional --registry http://registry.npmjs.org/

if ($LASTEXITCODE -eq 0) {
    Write-Host "Global install successful! Starting n8n..." -ForegroundColor Green
    n8n start
} else {
    Write-Host "Global install failed, trying Yarn..." -ForegroundColor Yellow
    
    # Try installing yarn first
    npm install -g yarn --registry http://registry.npmjs.org/ 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Installing n8n with Yarn..." -ForegroundColor Cyan
        yarn config set registry http://registry.npmjs.org/
        yarn global add n8n
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Yarn install successful! Starting n8n..." -ForegroundColor Green
            n8n start
        } else {
            Write-Host "All methods failed. Trying direct download..." -ForegroundColor Red
            Write-Host "This is the last resort method..." -ForegroundColor Yellow
            
            # Last resort: try with different settings
            $env:NODE_TLS_REJECT_UNAUTHORIZED = "0"
            npm config set ca ""
            npx --yes n8n@latest start
        }
    } else {
        Write-Host "Yarn install failed too. Trying last resort..." -ForegroundColor Red
        $env:NODE_TLS_REJECT_UNAUTHORIZED = "0"
        npm config set ca ""
        npx --yes n8n@latest start
    }
}

Write-Host "`nIf n8n started successfully, access it at: http://localhost:5678" -ForegroundColor Green
Read-Host "Press Enter to exit"
