# Simple script to run a command in a new window

# Define the command to run
$command = "cd Server; npm run dev"

# Start a new PowerShell window
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", $command

Write-Host "Server started in a new window." 