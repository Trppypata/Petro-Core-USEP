@echo off
echo Importing rocks directly to Supabase database...
echo.

REM Check if a file path was provided
if "%~1"=="" (
  echo Using default Excel file: src/excel/Database.xlsx
  node src/scripts/verify-rock-import.js import
) else (
  echo Using Excel file: %~1
  node src/scripts/verify-rock-import.js import "%~1"
)

echo.
echo Import process completed.
pause 