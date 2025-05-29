# Simple script to run the client in a new window

# Define the command to run
$command = "cd Petro-Core; npm run dev"

# Start a new PowerShell window
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", $command

Write-Host "Client started in a new window." 