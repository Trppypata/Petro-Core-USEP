const XLSX = require('xlsx');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateMetamorphicFoliationData() {
  try {
    console.log('🔄 Starting metamorphic foliation data update...');
    
    // Path to your Excel file
    const excelPath = path.join(__dirname, 'src/excel/Database.xlsx');
    
    if (!require('fs').existsSync(excelPath)) {
      console.error(`❌ Excel file not found: ${excelPath}`);
      return;
    }
    
    console.log(`📖 Reading Excel file: ${excelPath}`);
    
    // Read the Excel file
    const workbook = XLSX.readFile(excelPath);
    
    // Get the Metamorphic sheet
    const metamorphicSheet = workbook.Sheets['Metamorphic'];
    if (!metamorphicSheet) {
      console.error('❌ Metamorphic sheet not found in Excel file');
      return;
    }
    
    // Convert sheet to JSON
    const metamorphicData = XLSX.utils.sheet_to_json(metamorphicSheet);
    console.log(`📊 Found ${metamorphicData.length} metamorphic rocks in Excel`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    // Process each metamorphic rock
    for (const row of metamorphicData) {
      try {
        const rockName = row['Rock Name'] || row['Name'];
        const foliation = row['Foliation'];
        const foliationType = row['Foliation Type'];
        
        if (!rockName) {
          console.warn('⚠️ Skipping row with no rock name');
          continue;
        }
        
        console.log(`🔄 Updating ${rockName}: Foliation=${foliation}, Type=${foliationType}`);
        
        // Update the rock in the database
        const { data, error } = await supabase
          .from('rocks')
          .update({
            foliation: foliation || '',
            foliation_type: foliationType || ''
          })
          .eq('name', rockName)
          .eq('category', 'Metamorphic');
        
        if (error) {
          console.error(`❌ Error updating ${rockName}:`, error.message);
          errorCount++;
        } else {
          console.log(`✅ Successfully updated ${rockName}`);
          updatedCount++;
        }
        
      } catch (error) {
        console.error(`❌ Error processing row:`, error);
        errorCount++;
      }
    }
    
    console.log('\n📊 Update Summary:');
    console.log(`✅ Successfully updated: ${updatedCount} rocks`);
    console.log(`❌ Errors: ${errorCount} rocks`);
    console.log(`📊 Total processed: ${metamorphicData.length} rocks`);
    
    // Verify the updates
    console.log('\n🔍 Verifying updates...');
    const { data: verificationData, error: verificationError } = await supabase
      .from('rocks')
      .select('name, foliation, foliation_type')
      .eq('category', 'Metamorphic')
      .order('name');
    
    if (verificationError) {
      console.error('❌ Error verifying updates:', verificationError);
    } else {
      console.log('\n📋 Current metamorphic rocks with foliation data:');
      verificationData.forEach(rock => {
        console.log(`${rock.name}: Foliation=${rock.foliation}, Type=${rock.foliation_type}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Run the update
updateMetamorphicFoliationData();
