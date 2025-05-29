@echo off
echo Starting Petro Core Server...

:: Deploy database functions
echo Deploying database functions...
call npm run deploy:functions

:: Start the server
echo Starting server...
call npm run dev

pause 