@echo off
echo Fixing and enhancing the Petro-Core database...

echo.
echo Step 1: Running general rock duplicate fix script...
cd Server
node src/scripts/fix-duplicate-rocks.js

echo.
echo Step 2: Enhancing sedimentary rock data...
node src/scripts/enhance-sedimentary-rocks.js

echo.
echo Step 3: Filling missing rock data (associated minerals, coordinates, etc.)...
node src/scripts/fill-missing-rock-data.js

echo.
echo Database enhancement complete!
echo Please restart your server to see the updated data.
pause 