@echo off
echo Rock Import Debugging Tool
echo =======================
echo.

set SCRIPT=src\scripts\verify-rock-import.js

if "%1"=="" (
  echo Usage:
  echo   debug-rock-import analyze [filepath]  - Analyze Excel file structure
  echo   debug-rock-import check               - Check rocks in Supabase
  echo   debug-rock-import import [filepath]   - Import Excel file directly
  goto :EOF
)

set COMMAND=%1
set FILE_PATH=%2

if "%COMMAND%"=="analyze" (
  echo Analyzing Excel file structure...
  node %SCRIPT% analyze %FILE_PATH%
) else if "%COMMAND%"=="check" (
  echo Checking rocks in Supabase...
  node %SCRIPT% check
) else if "%COMMAND%"=="import" (
  echo Importing rocks directly...
  node %SCRIPT% import %FILE_PATH%
) else (
  echo Unknown command: %COMMAND%
  echo.
  echo Valid commands are: analyze, check, import
)

echo.
pause 