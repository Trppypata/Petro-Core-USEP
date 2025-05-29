# PowerShell script to start both server and client

# Function to start a new PowerShell window with the specified command
function Start-ProcessInNewWindow {
    param (
        [string]$Title,
        [string]$Path,
        [string]$Command
    )
    
    Write-Host "Starting $Title in $Path..."
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Path'; $Command"
}

# Start the server
Start-ProcessInNewWindow -Title "Petro-Core Server" -Path "$PSScriptRoot\Server" -Command "npm run dev"

# Wait a bit for the server to start
Start-Sleep -Seconds 5

# Start the client
Start-ProcessInNewWindow -Title "Petro-Core Client" -Path "$PSScriptRoot\Petro-Core" -Command "npm run dev"

Write-Host "Both applications started. Check the new PowerShell windows for output." 