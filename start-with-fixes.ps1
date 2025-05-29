# PowerShell script to fix the database and start both server and client

# First run the database fixes
Write-Host "Starting database fixes..." -ForegroundColor Green
Set-Location -Path "Server"
Write-Host "Running fix-duplicate-rocks.js..." -ForegroundColor Cyan
node src/scripts/fix-duplicate-rocks.js

Write-Host "Running enhance-sedimentary-rocks.js..." -ForegroundColor Cyan
node src/scripts/enhance-sedimentary-rocks.js

Write-Host "Running fill-missing-rock-data.js..." -ForegroundColor Cyan
node src/scripts/fill-missing-rock-data.js

Write-Host "Database fixes completed" -ForegroundColor Green
Set-Location -Path ".."

# Now start the server
Write-Host "`nStarting server..." -ForegroundColor Cyan
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd Server; npm run dev"

# Wait for server to initialize
Write-Host "Waiting for server to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start the client
Write-Host "Starting client..." -ForegroundColor Cyan
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd Petro-Core; npm run dev"

Write-Host "`nBoth applications started. Check the new PowerShell windows for output." -ForegroundColor Green 