Write-Host "Importing rocks directly to Supabase database..." -ForegroundColor Green
Write-Host

# Check if a file path was provided
if ($args.Count -gt 0) {
    $filePath = $args[0]
    Write-Host "Using Excel file: $filePath" -ForegroundColor Cyan
    node src/scripts/verify-rock-import.js import "$filePath"
} else {
    Write-Host "Using default Excel file: src/excel/Database.xlsx" -ForegroundColor Cyan
    node src/scripts/verify-rock-import.js import
}

Write-Host
Write-Host "Import process completed." -ForegroundColor Green
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 