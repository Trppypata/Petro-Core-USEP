const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Path to Excel file
const databasePath = path.join(__dirname, '../excel/Database.xlsx');

console.log('Counting rows in Excel file...');

// Process Database.xlsx (rocks)
if (fs.existsSync(databasePath)) {
  console.log(`\nDatabase.xlsx exists at ${databasePath}`);
  const workbook = XLSX.read(fs.readFileSync(databasePath));
  console.log('Sheets:', workbook.SheetNames);
  
  let totalValidRows = 0;
  let totalRows = 0;
  let rowsWithoutNames = 0;
  
  workbook.SheetNames.forEach(sheetName => {
    console.log(`\n=== Sheet: ${sheetName} ===`);
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    
    totalRows += data.length;
    console.log(`Total rows: ${data.length}`);
    
    // Count rows with valid rock names
    let validRows = 0;
    let missingNames = 0;
    
    data.forEach((row, index) => {
      const rockName = row['Rock Name'] || row['Name'] || row['Sample Name'] || row['Rock'] || row['Sample'] || '';
      
      if (rockName && rockName.toString().trim() !== '') {
        validRows++;
      } else {
        missingNames++;
        console.log(`Row ${index+1} has no rock name. Fields:`, Object.keys(row).slice(0, 3));
      }
    });
    
    console.log(`Rows with valid rock names: ${validRows}`);
    console.log(`Rows missing rock names: ${missingNames}`);
    
    totalValidRows += validRows;
    rowsWithoutNames += missingNames;
    
    // If this is Ore Samples sheet, do more detailed analysis
    if (sheetName === 'Ore Samples') {
      console.log('\nDetailed Ore Samples analysis:');
      
      // Check column that should contain rock names
      const nameColumns = ['Rock Name', 'Name', 'Sample Name', 'Rock', 'Sample'];
      nameColumns.forEach(colName => {
        const withCol = data.filter(row => row[colName]).length;
        if (withCol > 0) {
          console.log(`Rows with '${colName}': ${withCol}`);
        }
      });
      
      // Check first few rows to debug
      console.log('\nFirst 5 rows keys:');
      data.slice(0, 5).forEach((row, i) => {
        console.log(`Row ${i+1} keys:`, Object.keys(row));
      });
    }
  });
  
  console.log('\n=== Summary ===');
  console.log(`Total rows across all sheets: ${totalRows}`);
  console.log(`Rows with valid rock names: ${totalValidRows}`);
  console.log(`Rows missing rock names: ${rowsWithoutNames}`);
  console.log(`Expected import count: ${totalValidRows}`);
  
} else {
  console.log(`Database.xlsx not found at ${databasePath}`);
} 