/**
 * Script to restore duplicates by re-importing from Database.xlsx
 * Run with: node restore-duplicates.js
 */
import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabaseUrl = 'https://tobjghstopxuntbewrxu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvYmpnaHN0b3B4dW50YmV3cnh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMTE5NjYsImV4cCI6MjA2Mzg4Nzk2Nn0.lJAbvvhwbqfOj9ChVOp1pI_lpT5gUsD_6YmgyB6OFho';

const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreDuplicates() {
  try {
    console.log('🔄 Starting duplicate restoration from Database.xlsx...');
    
    // Read the Excel file
    const excelPath = path.join(__dirname, 'src', 'assets', 'Database.xlsx');
    console.log(`📁 Reading Excel file: ${excelPath}`);
    
    const workbook = XLSX.readFile(excelPath);
    console.log(`📊 Found ${workbook.SheetNames.length} sheets:`, workbook.SheetNames);
    
    let totalImported = 0;
    let totalSkipped = 0;
    
    // Process each sheet
    for (const sheetName of workbook.SheetNames) {
      console.log(`\n📋 Processing sheet: ${sheetName}`);
      
      try {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        console.log(`   Found ${jsonData.length} rows in sheet`);
        
        // Determine category based on sheet name
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
        
        console.log(`   Category determined: ${category}`);
        
        // Process each row
        for (let index = 0; index < jsonData.length; index++) {
          const row = jsonData[index];
          
          // Extract rock name with fallbacks
          let rockName = 
            row["Rock Name"] || 
            row["Name"] || 
            row["Sample Name"] || 
            row["Rock"] || 
            "";
          
          // Skip if no name found
          if (!rockName) {
            console.log(`   ⏭️  Skipping row ${index + 1} - no rock name found`);
            totalSkipped++;
            continue;
          }
          
          // Generate rock code if not present
          let rockCode = row["Rock Code"] || row["Code"] || "";
          if (!rockCode) {
            // Generate code based on category and index
            if (category === 'Ore Samples') {
              rockCode = `O-${String(index + 1).padStart(4, '0')}`;
            } else {
              const categoryPrefix = category.charAt(0);
              rockCode = `${categoryPrefix}-${String(index + 1).padStart(4, '0')}`;
            }
          }
          
          // Create rock object
          const rock = {
            name: rockName,
            rock_code: rockCode,
            category: category,
            type: category.toLowerCase(),
            description: row["Description"] || "",
            color: row["Color"] || "",
            texture: row["Texture"] || "",
            locality: row["Locality"] || "",
            mineral_composition: row["Mineral Composition"] || "",
            formation: row["Formation"] || "",
            geological_age: row["Geological Age"] || "",
            // Ore samples specific fields
            commodity_type: row["Type of Commodity"] || row["Commodity Type"] || "",
            ore_group: row["Ore Group"] || row["Type of Deposit"] || "",
            mining_company: row["Mining Company"] || row["Mining Company/Donated by"] || "",
            // Metamorphic specific fields
            associated_minerals: row["Associated Minerals"] || "",
            metamorphism_type: row["Metamorphism Type"] || "",
            metamorphic_grade: row["Metamorphic Grade"] || "",
            parent_rock: row["Parent Rock"] || "",
            // Igneous specific fields
            silica_content: row["Silica Content"] || "",
            cooling_rate: row["Cooling Rate"] || "",
            mineral_content: row["Mineral Content"] || "",
            // Sedimentary specific fields
            bedding: row["Bedding"] || "",
            sorting: row["Sorting"] || "",
            roundness: row["Roundness"] || "",
            fossil_content: row["Fossil Content"] || "",
            sediment_source: row["Sediment Source"] || "",
            // Additional fields
            chemical_formula: row["Chemical Formula"] || "",
            hardness: row["Hardness"] || "",
            luster: row["Luster"] || "",
            streak: row["Streak"] || "",
            reaction_to_hcl: row["Reaction to HCl"] || "",
            magnetism: row["Magnetism"] || "",
            // Coordinates
            latitude: row["Latitude"] || row["LAT"] || "",
            longitude: row["Longitude"] || row["LONG"] || "",
            coordinates: row["Coordinates"] || "",
            status: "active"
          };
          
          // Insert into database
          try {
            const { data, error } = await supabase
              .from('rocks')
              .insert(rock);
            
            if (error) {
              if (error.code === '23505') { // Unique constraint violation
                console.log(`   ⚠️  Skipping ${rockName} - already exists (${rockCode})`);
                totalSkipped++;
              } else {
                console.error(`   ❌ Error inserting ${rockName}:`, error.message);
                totalSkipped++;
              }
            } else {
              console.log(`   ✅ Imported: ${rockName} (${rockCode})`);
              totalImported++;
            }
          } catch (insertError) {
            console.error(`   ❌ Error inserting ${rockName}:`, insertError.message);
            totalSkipped++;
          }
        }
        
      } catch (sheetError) {
        console.error(`   ❌ Error processing sheet ${sheetName}:`, sheetError.message);
      }
    }
    
    console.log(`\n🎉 Import completed!`);
    console.log(`📊 Total imported: ${totalImported}`);
    console.log(`📊 Total skipped: ${totalSkipped}`);
    console.log(`📊 Total processed: ${totalImported + totalSkipped}`);
    
  } catch (error) {
    console.error('❌ Error in restoration:', error);
  }
}

// Run the restoration
restoreDuplicates();
