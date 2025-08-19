const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixOreSampleNames() {
  try {
    console.log('🔧 Fixing ore sample names...');
    
    // Read the Excel file to get the correct data
    const excelPath = path.resolve(__dirname, '../../src/excel/Database.xlsx');
    console.log(`📖 Reading Excel file: ${excelPath}`);
    
    if (!require('fs').existsSync(excelPath)) {
      console.error(`❌ Excel file not found: ${excelPath}`);
      return;
    }
    
    const workbook = XLSX.readFile(excelPath);
    const worksheet = workbook.Sheets['Ore Samples'];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📊 Found ${jsonData.length} ore samples in Excel file`);
    
    // Get current ore samples from database
    const { data: currentOreSamples, error: fetchError } = await supabase
      .from('rocks')
      .select('*')
      .eq('category', 'Ore Samples');
    
    if (fetchError) {
      console.error('❌ Error fetching current ore samples:', fetchError);
      return;
    }
    
    console.log(`📊 Found ${currentOreSamples.length} ore samples in database`);
    
    // Create a map of rock codes to Excel data
    const excelDataMap = new Map();
    jsonData.forEach((row, index) => {
      const rockCode = row['Rock Code'] || `O-${String(index + 1).padStart(3, '0')}`;
      const cleanRockCode = rockCode.replace(/\s+/g, ''); // Remove spaces
      excelDataMap.set(cleanRockCode, row);
    });
    
    console.log('🔄 Updating ore sample names...');
    
    let updatedCount = 0;
    
    for (const dbOreSample of currentOreSamples) {
      try {
        // Clean the rock code for comparison
        const cleanDbRockCode = dbOreSample.rock_code.replace(/\s+/g, '');
        
        // Find matching Excel data
        const excelData = excelDataMap.get(cleanDbRockCode);
        
        if (excelData) {
          // Create proper name based on commodity type and rock code
          const commodityType = excelData['Type of Commodity'] || excelData['Commodity Type'] || '';
          const rockCode = excelData['Rock Code'] || dbOreSample.rock_code;
          const cleanRockCode = rockCode.replace(/\s+/g, '');
          
          let newName = '';
          if (commodityType && commodityType.trim() !== '') {
            newName = `${commodityType.trim()} (${cleanRockCode})`;
          } else {
            newName = `Ore Sample ${cleanRockCode}`;
          }
          
          // Update the database record
          const { error: updateError } = await supabase
            .from('rocks')
            .update({ 
              name: newName,
              commodity_type: commodityType,
              ore_group: excelData['Ore Group'] || excelData['Type of Deposit'] || '',
              mining_company: excelData['Mining Company/Donated by'] || excelData['Mining Company'] || '',
              description: excelData['Overall Description'] || '',
              locality: excelData['Locality'] || '',
              coordinates: excelData['Coordinates'] || '',
              rock_code: cleanRockCode // Ensure clean rock code format
            })
            .eq('id', dbOreSample.id);
          
          if (updateError) {
            console.error(`❌ Error updating ${dbOreSample.name}:`, updateError);
          } else {
            console.log(`✅ Updated: ${dbOreSample.name} → ${newName}`);
            updatedCount++;
          }
        } else {
          console.log(`⚠️ No Excel data found for rock code: ${cleanDbRockCode}`);
        }
      } catch (error) {
        console.error(`❌ Error processing ${dbOreSample.name}:`, error);
      }
    }
    
    console.log(`\n🎉 Successfully updated ${updatedCount} ore samples`);
    
    // Verify the results
    console.log('\n📋 Verifying results...');
    const { data: updatedOreSamples, error: verifyError } = await supabase
      .from('rocks')
      .select('rock_code, name, commodity_type')
      .eq('category', 'Ore Samples')
      .order('rock_code');
    
    if (verifyError) {
      console.error('❌ Error verifying results:', verifyError);
      return;
    }
    
    console.log('\n📊 Updated ore samples:');
    updatedOreSamples.forEach(ore => {
      console.log(`  ${ore.rock_code}: ${ore.name} (${ore.commodity_type || 'No commodity type'})`);
    });
    
  } catch (error) {
    console.error('❌ Error in fixOreSampleNames:', error);
  }
}

// Run the fix
fixOreSampleNames().then(() => {
  console.log('\n✨ Ore sample name fix completed!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});


