@echo off
echo Starting Petro-Core Server...
echo =========================
echo.

REM Check if .env file exists
if not exist .env (
  echo Warning: .env file not found. Creating a sample one.
  echo # Database configuration > .env
  echo SUPABASE_URL=your_supabase_url_here >> .env
  echo SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here >> .env
  echo. >> .env
  echo # Server configuration >> .env
  echo PORT=8000 >> .env
  echo NODE_ENV=development >> .env
  
  echo Please edit the .env file with your actual Supabase credentials.
  echo.
)

REM Verify node_modules exists
if not exist node_modules (
  echo Installing dependencies...
  call npm install
)

REM Start the server
echo Starting server on port 8000...
echo Press Ctrl+C to stop the server.
echo.

call npm run dev 