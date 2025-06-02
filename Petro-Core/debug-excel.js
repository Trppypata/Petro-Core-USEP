import * as XLSX from 'xlsx';

// Function to read Excel file
async function readExcelFile(filePath) {
  try {
    console.log(`Reading Excel file: ${filePath}`);
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;
    
    console.log(`Found ${sheetNames.length} sheets: ${sheetNames.join(', ')}`);
    
    // Process each sheet
    sheetNames.forEach(sheetName => {
      console.log(`\nSheet: ${sheetName}`);
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      // Check if data exists
      if (data.length === 0) {
        console.log('No data found in this sheet');
        return;
      }
      
      // Identify columns
      const columns = Object.keys(data[0]);
      console.log(`Columns: ${columns.join(', ')}`);
      
      // Show sample data (first 3 rows)
      console.log('\nSample data (first 3 rows):');
      data.slice(0, 3).forEach((row, index) => {
        console.log(`Row ${index + 1}:`, row);
      });
      
      // Count entries with specific columns
      const factCount = data.filter(row => row.Fact || row.fact).length;
      const categoryCount = data.filter(row => row.Category || row.category).length;
      
      console.log(`\nStatistics:`);
      console.log(`Total rows: ${data.length}`);
      console.log(`Rows with Fact/fact: ${factCount}`);
      console.log(`Rows with Category/category: ${categoryCount}`);
    });
    
  } catch (error) {
    console.error('Error reading Excel file:', error);
  }
}

// Path to the Excel file
const filePath = './public/petro-static/TRIVIAS.xlsx';

// Read the file
readExcelFile(filePath); 