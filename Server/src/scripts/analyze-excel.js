const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Path to Excel files
const databasePath = path.join(__dirname, '../excel/Database.xlsx');
const mineralsDatabasePath = path.join(__dirname, '../excel/DK_MINERALS_DATABASE.xlsx');

console.log('Analyzing Excel files...');

try {
  // Analyze Database.xlsx (rocks)
  if (fs.existsSync(databasePath)) {
    console.log(`\nAnalyzing ${databasePath}...`);
    const workbook = XLSX.read(fs.readFileSync(databasePath));
    
    console.log('Sheet names:', workbook.SheetNames);
    
    // Analyze each sheet
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);
      
      if (data.length > 0) {
        console.log(`\nSheet: ${sheetName} (${data.length} rows)`);
        
        // Get all headers from the first row
        const headers = Object.keys(data[0]);
        console.log('Headers:', headers);
        
        // Check first row values
        const firstRow = data[0];
        console.log('First row example:');
        headers.forEach(header => {
          console.log(`  ${header}: ${firstRow[header]}`);
        });
        
        // Check for 'HCl reaction' or similar
        const hclHeaders = headers.filter(h => 
          h.toLowerCase().includes('hcl') || 
          h.toLowerCase().includes('reaction') ||
          h.toLowerCase().includes('acid')
        );
        
        if (hclHeaders.length > 0) {
          console.log('Found potential HCl reaction headers:', hclHeaders);
        }
      } else {
        console.log(`Sheet: ${sheetName} (empty)`);
      }
    });
  } else {
    console.log(`File not found: ${databasePath}`);
  }
  
  // Analyze DK_MINERALS_DATABASE.xlsx
  if (fs.existsSync(mineralsDatabasePath)) {
    console.log(`\nAnalyzing ${mineralsDatabasePath}...`);
    const workbook = XLSX.read(fs.readFileSync(mineralsDatabasePath));
    
    console.log('Sheet names:', workbook.SheetNames);
    
    // Analyze first sheet only to avoid excessive output
    const firstSheet = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheet];
    const data = XLSX.utils.sheet_to_json(sheet);
    
    if (data.length > 0) {
      console.log(`\nSheet: ${firstSheet} (${data.length} rows)`);
      
      // Get all headers from the first row
      const headers = Object.keys(data[0]);
      console.log('Headers:', headers);
    } else {
      console.log(`Sheet: ${firstSheet} (empty)`);
    }
  } else {
    console.log(`File not found: ${mineralsDatabasePath}`);
  }
  
} catch (error) {
  console.error('Error analyzing Excel files:', error);
} 