const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Path to the Excel file
const excelPath = path.join(__dirname, '../../src/excel/DK_MINERALS_DATABASE.xlsx');

if (!fs.existsSync(excelPath)) {
  console.error('Excel file not found at:', excelPath);
  process.exit(1);
}

console.log('Analyzing Excel file at:', excelPath);

// Read the Excel file
const workbook = XLSX.read(fs.readFileSync(excelPath), { type: 'buffer' });

console.log('Sheet names:', workbook.SheetNames.join(', '));
console.log(`Total sheets: ${workbook.SheetNames.length}`);

let totalRows = 0;
let totalValidMinerals = 0;
const sheetCounts = {};
const sheetsWithNoMineralName = [];
const mineralNameColumnVariants = ['Mineral Name', 'Mineral', 'Name'];

// Process each sheet
workbook.SheetNames.forEach((sheetName) => {
  // Skip hidden or special sheets
  if (sheetName.startsWith('_') || sheetName === 'Sheet1') {
    console.log(`Skipping sheet: ${sheetName}`);
    return;
  }
  
  try {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    sheetCounts[sheetName] = {
      total: jsonData.length,
      valid: 0,
      skipped: 0,
      header: null
    };
    
    totalRows += jsonData.length;
    
    // Check first row for column names
    if (jsonData.length > 0) {
      const firstRow = jsonData[0];
      const keys = Object.keys(firstRow);
      sheetCounts[sheetName].header = keys.join(', ');
      
      // Check if any mineral name column variant exists
      const mineralNameColumn = mineralNameColumnVariants.find(variant => keys.includes(variant));
      if (!mineralNameColumn) {
        sheetsWithNoMineralName.push(sheetName);
        console.log(`WARNING: Sheet ${sheetName} does not have any recognized mineral name column`);
      }
    }
    
    // Count valid minerals
    jsonData.forEach((row) => {
      let hasMineralName = false;
      
      // Check for mineral name in any of the possible columns
      for (const variant of mineralNameColumnVariants) {
        if (row[variant]) {
          hasMineralName = true;
          break;
        }
      }
      
      if (hasMineralName) {
        sheetCounts[sheetName].valid++;
        totalValidMinerals++;
      } else {
        sheetCounts[sheetName].skipped++;
      }
    });
    
  } catch (error) {
    console.error(`Error processing sheet ${sheetName}:`, error);
  }
});

console.log('\n--- Excel Analysis Summary ---');
console.log(`Total rows across all sheets: ${totalRows}`);
console.log(`Total valid minerals (with name): ${totalValidMinerals}`);
console.log('\nSheet counts:');

// Sort sheets by number of valid minerals
const sortedSheets = Object.keys(sheetCounts).sort((a, b) => 
  sheetCounts[b].valid - sheetCounts[a].valid
);

sortedSheets.forEach(sheetName => {
  const count = sheetCounts[sheetName];
  console.log(`${sheetName}: ${count.valid} valid minerals out of ${count.total} rows (${count.skipped} skipped)`);
  console.log(`  Columns: ${count.header}`);
});

if (sheetsWithNoMineralName.length > 0) {
  console.log('\nWARNING: The following sheets do not have a recognized mineral name column:');
  console.log(sheetsWithNoMineralName.join(', '));
}

console.log('\nPossible issues:');
console.log('1. Some sheets may not have the expected "Mineral Name" column header');
console.log('2. Some rows may be missing mineral names');
console.log('3. There may be blank rows or header rows in some sheets');
console.log('4. Sheet names with special characters might cause issues during import'); 