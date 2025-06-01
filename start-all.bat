@echo off
echo Starting Petro-Core development environment...
echo.
echo Starting backend server...
start cmd /k "cd Server && npm run dev"
echo.
echo Starting frontend server...
echo.
echo Note: Wait for backend to fully start before using the application!
echo.
start cmd /k "cd Petro-Core && npm run dev -- --host"
echo.
echo Both servers should now be starting in separate windows.
echo.
echo Press any key to close this window...
pause > nul 