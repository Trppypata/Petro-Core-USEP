Write-Host "Starting Petro-Core Server..." -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "Warning: .env file not found. Creating a sample one." -ForegroundColor Yellow
    @"
# Database configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Server configuration
PORT=8000
NODE_ENV=development
"@ | Out-File -FilePath ".env" -Encoding utf8
    
    Write-Host "Please edit the .env file with your actual Supabase credentials." -ForegroundColor Yellow
    Write-Host
}

# Verify node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Cyan
    npm install
}

# Start the server
Write-Host "Starting server on port 8000..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server." -ForegroundColor Cyan
Write-Host

npm run dev 