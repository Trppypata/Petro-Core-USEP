const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Path to the Excel file
const excelPath = path.join(__dirname, '../../src/excel/Database.xlsx');

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
  
  // Map to store all rock codes and their occurrences
  const rockCodes = new Map();
  const duplicateCodes = [];
  let totalRocks = 0;
  const rockNameVariants = ['Rock Name', 'Name', 'Sample Name'];
  
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
        // Skip rows without rock name
        let rockName = null;
        for (const variant of rockNameVariants) {
          if (row[variant]) {
            rockName = row[variant];
            break;
          }
        }
        
        if (!rockName) return;
        
        totalRocks++;
        
        // Determine the rock category based on sheet name
        let category = sheetName;
        if (sheetName.toLowerCase().includes('igneous')) {
          category = 'Igneous';
        } else if (sheetName.toLowerCase().includes('sedimentary')) {
          category = 'Sedimentary';
        } else if (sheetName.toLowerCase().includes('metamorphic')) {
          category = 'Metamorphic';
        } else if (sheetName.toLowerCase().includes('ore') || sheetName.toLowerCase().includes('mineral')) {
          category = 'Ore Samples';
        }
        
        // Check for rock code
        let rockCode = row['Rock Code'] || row['Code'];
        
        // If no code exists, we need to generate one as the import would
        if (!rockCode) {
          // For ore samples, use O-XXXX format
          if (category === 'Ore Samples') {
            rockCode = `O-${String(index + 1).padStart(4, '0')}`;
          } else {
            // For other rocks, use first letter of category + index
            rockCode = `${category.charAt(0)}-${String(index + 1).padStart(4, '0')}`;
          }
        }
        
        // Track this code
        if (rockCodes.has(rockCode)) {
          duplicateCodes.push({
            code: rockCode,
            sheet: sheetName,
            row: index + 1,
            name: rockName,
            previous: rockCodes.get(rockCode)
          });
        } else {
          rockCodes.set(rockCode, {
            sheet: sheetName,
            row: index + 1,
            name: rockName,
            category
          });
        }
      });
    } catch (error) {
      console.error(`Error processing sheet ${sheetName}:`, error);
    }
  });
  
  console.log(`Total rocks found in Excel: ${totalRocks}`);
  console.log(`Total unique rock codes: ${rockCodes.size}`);
  
  if (duplicateCodes.length > 0) {
    console.log(`\nWARNING: Found ${duplicateCodes.length} duplicate rock codes in Excel file:`);
    duplicateCodes.forEach(dup => {
      console.log(`Code "${dup.code}" appears in:`);
      console.log(`  - Sheet: ${dup.sheet}, Row: ${dup.row}, Rock: ${dup.name}`);
      console.log(`  - Sheet: ${dup.previous.sheet}, Row: ${dup.previous.row}, Rock: ${dup.previous.name}`);
    });
    console.log('\nDuplicate codes will cause conflicts on import with onConflict: "rock_code"');
  }
  
  // Now check database
  console.log('\nChecking database for existing rocks...');
  const { data: dbRocks, error } = await supabase
    .from('rocks')
    .select('id, rock_code, name, category')
    .order('category');
  
  if (error) {
    console.error('Error fetching rocks from database:', error);
    return;
  }
  
  console.log(`Found ${dbRocks?.length || 0} rocks in database`);
  
  // Count by category
  const categoryCounts = {};
  if (dbRocks) {
    dbRocks.forEach(rock => {
      const category = rock.category || 'Unknown';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    console.log('\nRocks by category:');
    Object.keys(categoryCounts).sort().forEach(category => {
      console.log(`${category}: ${categoryCounts[category]}`);
    });
  }
  
  // Find rocks in Excel that already exist in DB
  if (dbRocks?.length) {
    console.log('\nChecking for rocks in Excel that already exist in database...');
    const dbCodes = new Set(dbRocks.map(r => r.rock_code));
    let existingCount = 0;
    let newCount = 0;
    
    rockCodes.forEach((info, code) => {
      if (dbCodes.has(code)) {
        existingCount++;
      } else {
        newCount++;
      }
    });
    
    console.log(`Rocks already in database: ${existingCount}`);
    console.log(`New rocks from Excel: ${newCount}`);
    
    if (existingCount + newCount !== rockCodes.size) {
      console.log('\nWARNING: Discrepancy in rock counts!');
    }
  }
  
  // Group by categories
  console.log('\nRock categories from Excel:');
  const categoryMap = {};
  rockCodes.forEach((info) => {
    const category = info.category || 'Unknown';
    categoryMap[category] = (categoryMap[category] || 0) + 1;
  });
  
  Object.keys(categoryMap).sort().forEach(category => {
    console.log(`${category}: ${categoryMap[category]}`);
  });
  
  console.log('\nPossible reasons for import count discrepancy:');
  console.log('1. Duplicate rock codes (found ' + duplicateCodes.length + ')');
  if (dbRocks?.length) {
    console.log('2. Rocks already exist in database');
  }
  console.log('3. Some rows in Excel missing required data (rock name)');
  console.log('4. Sheet names/categories with special characters or formatting issues');
  console.log('\nRecommendation: If importing new rocks, make sure each has a unique code and name.');
}

main().catch(err => {
  console.error('Error running analysis:', err);
}); 