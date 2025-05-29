const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Path to the Excel file
const excelPath = path.join(__dirname, 'src/excel/Database.xlsx');

// Check if the file exists
if (!fs.existsSync(excelPath)) {
  console.error(`File not found: ${excelPath}`);
  process.exit(1);
}

console.log(`Reading Excel file: ${excelPath}`);

// Read the Excel file
const workbook = XLSX.read(fs.readFileSync(excelPath), { type: 'buffer' });

// Log sheet names
console.log('\nSheets in the workbook:');
console.log(workbook.SheetNames);

// Check each sheet
workbook.SheetNames.forEach(sheetName => {
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet);
  
  console.log(`\n--- Sheet: ${sheetName} ---`);
  console.log(`Number of rows: ${jsonData.length}`);
  
  if (jsonData.length > 0) {
    console.log('Column headers:');
    console.log(Object.keys(jsonData[0]));
    
    // Log first row data
    console.log('\nSample data (first row):');
    console.log(jsonData[0]);
  } else {
    console.log('Sheet is empty');
  }
}); 