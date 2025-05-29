@echo off
echo Running database migrations...

cd %~dp0

echo Step 1: Adding coordinates column to rocks table...
node src/db/run-migration.js --script=migrate_add_coordinates.sql

echo Step 2: Adding missing fields from Excel to rocks table...
node src/db/run-migration.js --script=migrate_add_missing_fields.sql

echo Step 3: Fixing Ore Samples in rocks table...
node src/db/run-migration.js --script=update_ore_samples.sql

echo All migrations completed!
pause 