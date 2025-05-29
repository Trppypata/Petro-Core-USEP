Write-Host "Rock Import Debugging Tool" -ForegroundColor Green
Write-Host "=======================" -ForegroundColor Green
Write-Host

$Script = "src\scripts\verify-rock-import.js"

if ($args.Count -eq 0) {
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\debug-rock-import.ps1 analyze [filepath]  - Analyze Excel file structure"
    Write-Host "  .\debug-rock-import.ps1 check               - Check rocks in Supabase"
    Write-Host "  .\debug-rock-import.ps1 import [filepath]   - Import Excel file directly"
    exit
}

$Command = $args[0]
$FilePath = if ($args.Count -gt 1) { $args[1] } else { $null }

switch ($Command) {
    "analyze" {
        Write-Host "Analyzing Excel file structure..." -ForegroundColor Cyan
        node $Script analyze $FilePath
    }
    "check" {
        Write-Host "Checking rocks in Supabase..." -ForegroundColor Cyan
        node $Script check
    }
    "import" {
        Write-Host "Importing rocks directly..." -ForegroundColor Cyan
        node $Script import $FilePath
    }
    default {
        Write-Host "Unknown command: $Command" -ForegroundColor Red
        Write-Host
        Write-Host "Valid commands are: analyze, check, import" -ForegroundColor Yellow
    }
}

Write-Host
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 