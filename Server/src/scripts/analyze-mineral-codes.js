const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Path to the Excel file
const excelPath = path.join(__dirname, '../../src/excel/DK_MINERALS_DATABASE.xlsx');

// Check if the Excel file exists
if (!fs.existsSync(excelPath)) {
  console.error('Excel file not found at:', excelPath);
  process.exit(1);
}

// Validate Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Analyzing Excel file for potential issues...');
  
  // Read the Excel file
  const workbook = XLSX.read(fs.readFileSync(excelPath), { type: 'buffer' });
  
  // Map to store all mineral codes and their occurrences
  const mineralCodes = new Map();
  const duplicateCodes = [];
  let totalMinerals = 0;
  const mineralNameVariants = ['Mineral Name', 'Mineral', 'Name'];
  
  // Process each sheet
  workbook.SheetNames.forEach((sheetName) => {
    // Skip hidden or special sheets
    if (sheetName.startsWith('_') || sheetName === 'Sheet1') {
      return;
    }
    
    try {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      jsonData.forEach((row, index) => {
        // Skip rows without mineral name
        let mineralName = null;
        for (const variant of mineralNameVariants) {
          if (row[variant]) {
            mineralName = row[variant];
            break;
          }
        }
        
        if (!mineralName) return;
        
        totalMinerals++;
        
        // Check for mineral code
        let mineralCode = row['Mineral Code'];
        
        // If no code exists, we need to generate one as the import would
        if (!mineralCode) {
          mineralCode = `${sheetName.substring(0, 3)}-${mineralName.replace(/\s+/g, '').substring(0, 6)}-${Math.floor(Math.random() * 1000)}`;
        }
        
        // Track this code
        if (mineralCodes.has(mineralCode)) {
          duplicateCodes.push({
            code: mineralCode,
            sheet: sheetName,
            row: index + 1,
            name: mineralName,
            previous: mineralCodes.get(mineralCode)
          });
        } else {
          mineralCodes.set(mineralCode, {
            sheet: sheetName,
            row: index + 1,
            name: mineralName
          });
        }
      });
    } catch (error) {
      console.error(`Error processing sheet ${sheetName}:`, error);
    }
  });
  
  console.log(`Total minerals found in Excel: ${totalMinerals}`);
  console.log(`Total unique mineral codes: ${mineralCodes.size}`);
  
  if (duplicateCodes.length > 0) {
    console.log(`\nWARNING: Found ${duplicateCodes.length} duplicate mineral codes in Excel file:`);
    duplicateCodes.forEach(dup => {
      console.log(`Code "${dup.code}" appears in:`);
      console.log(`  - Sheet: ${dup.sheet}, Row: ${dup.row}, Mineral: ${dup.name}`);
      console.log(`  - Sheet: ${dup.previous.sheet}, Row: ${dup.previous.row}, Mineral: ${dup.previous.name}`);
    });
    console.log('\nDuplicate codes will cause conflicts on import with onConflict: "mineral_code"');
  }
  
  // Now check database
  console.log('\nChecking database for existing minerals...');
  const { data: dbMinerals, error } = await supabase
    .from('minerals')
    .select('id, mineral_code, mineral_name, category')
    .order('category');
  
  if (error) {
    console.error('Error fetching minerals from database:', error);
    return;
  }
  
  console.log(`Found ${dbMinerals.length} minerals in database`);
  
  // Count by category
  const categoryCounts = {};
  dbMinerals.forEach(mineral => {
    const category = mineral.category || 'Unknown';
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });
  
  console.log('\nMinerals by category:');
  Object.keys(categoryCounts).sort().forEach(category => {
    console.log(`${category}: ${categoryCounts[category]}`);
  });
  
  // Find minerals in Excel that already exist in DB
  console.log('\nChecking for minerals in Excel that already exist in database...');
  const dbCodes = new Set(dbMinerals.map(m => m.mineral_code));
  let existingCount = 0;
  let newCount = 0;
  
  mineralCodes.forEach((info, code) => {
    if (dbCodes.has(code)) {
      existingCount++;
    } else {
      newCount++;
    }
  });
  
  console.log(`Minerals already in database: ${existingCount}`);
  console.log(`New minerals from Excel: ${newCount}`);
  
  if (existingCount + newCount !== mineralCodes.size) {
    console.log('\nWARNING: Discrepancy in mineral counts!');
  }
  
  console.log('\nPossible reasons for import count discrepancy:');
  console.log('1. Duplicate mineral codes (found ' + duplicateCodes.length + ')');
  console.log('2. Minerals already exist in database (found ' + existingCount + ')');
  console.log('3. Some rows in Excel missing required data (mineral name)');
  console.log('4. Sheet names/categories with special characters or formatting issues');
  console.log('\nRecommendation: If importing new minerals, make sure each has a unique code and name.');
}

main().catch(err => {
  console.error('Error running analysis:', err);
}); 