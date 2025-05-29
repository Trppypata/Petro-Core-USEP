@echo off
echo Running default rock import...
cd %~dp0

echo Step 1: Run the database migrations first...
call run-migration.bat

echo Step 2: Importing default rocks...
node -e "const axios = require('axios'); axios.post('http://localhost:8000/api/rocks/import-default').then(res => { console.log('Import response:', res.data); }).catch(err => { console.error('Import error:', err.response ? err.response.data : err.message); })"

echo Step 3: Verifying import results...
node src/scripts/verify-rock-import.js

echo Import process completed!
pause 