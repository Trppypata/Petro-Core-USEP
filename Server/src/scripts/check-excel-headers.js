const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Path to Excel files
const databasePath = path.join(__dirname, '../excel/Database.xlsx');
const mineralsDatabasePath = path.join(__dirname, '../excel/DK_MINERALS_DATABASE.xlsx');

console.log('Checking Excel headers...');

// Process Database.xlsx (rocks)
if (fs.existsSync(databasePath)) {
  console.log(`\nDatabase.xlsx exists at ${databasePath}`);
  const workbook = XLSX.read(fs.readFileSync(databasePath));
  console.log('Sheets:', workbook.SheetNames);
  
  workbook.SheetNames.forEach(sheetName => {
    console.log(`\nHeaders in sheet ${sheetName}:`);
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      console.log(headers);
    } else {
      console.log('(Empty sheet)');
    }
  });
} else {
  console.log(`Database.xlsx not found at ${databasePath}`);
}

// Process DK_MINERALS_DATABASE.xlsx
if (fs.existsSync(mineralsDatabasePath)) {
  console.log(`\nDK_MINERALS_DATABASE.xlsx exists at ${mineralsDatabasePath}`);
  const workbook = XLSX.read(fs.readFileSync(mineralsDatabasePath));
  console.log('Sheets:', workbook.SheetNames.join(', '));
  
  // Just check the first sheet to avoid too much output
  const firstSheet = workbook.SheetNames[0];
  console.log(`\nHeaders in first sheet (${firstSheet}):`);
  const sheet = workbook.Sheets[firstSheet];
  const data = XLSX.utils.sheet_to_json(sheet);
  
  if (data.length > 0) {
    const headers = Object.keys(data[0]);
    console.log(headers);
  } else {
    console.log('(Empty sheet)');
  }
} else {
  console.log(`DK_MINERALS_DATABASE.xlsx not found at ${mineralsDatabasePath}`);
} 