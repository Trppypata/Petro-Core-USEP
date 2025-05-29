# PowerShell script to fix and enhance the Petro-Core database

Write-Host "Fixing and enhancing the Petro-Core database..." -ForegroundColor Green

# First update database schema if needed
Write-Host "`nChecking for schema updates..." -ForegroundColor Cyan
Set-Location -Path "Server"

# Check if the PSQL client is available (optional)
$psqlExists = $null -ne (Get-Command "psql" -ErrorAction SilentlyContinue)
if ($psqlExists) {
    # PSQL is available, so we can run the SQL file directly
    Write-Host "PSQL found, running SQL migration..." -ForegroundColor Cyan
    
    # Get database connection info from .env file if it exists
    $envFilePath = Join-Path -Path (Get-Location) -ChildPath ".env"
    if (Test-Path $envFilePath) {
        $envContent = Get-Content $envFilePath
        $dbUrl = $envContent | Where-Object { $_ -match "DATABASE_URL=" } | ForEach-Object { $_ -replace "DATABASE_URL=", "" }
        
        if ($dbUrl) {
            Write-Host "Executing SQL migration with database URL from .env file..." -ForegroundColor Cyan
            $sqlFilePath = Join-Path -Path (Get-Location) -ChildPath "src\migrations\add_missing_columns.sql"
            psql $dbUrl -f $sqlFilePath
        } else {
            Write-Host "DATABASE_URL not found in .env file, skipping direct SQL migration" -ForegroundColor Yellow
        }
    } else {
        Write-Host ".env file not found, skipping direct SQL migration" -ForegroundColor Yellow
    }
}

Write-Host "`nStep 1: Running general rock duplicate fix script..." -ForegroundColor Cyan
node src/scripts/fix-duplicate-rocks.js

Write-Host "`nStep 2: Enhancing sedimentary rock data..." -ForegroundColor Cyan
node src/scripts/enhance-sedimentary-rocks.js

Write-Host "`nStep 3: Filling missing rock data (associated minerals, coordinates, etc.)..." -ForegroundColor Cyan
node src/scripts/fill-missing-rock-data.js

Write-Host "`nDatabase enhancement complete!" -ForegroundColor Green
Write-Host "Please restart your server to see the updated data." -ForegroundColor Yellow

Write-Host "`nPress any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 