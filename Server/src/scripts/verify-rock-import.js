const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const axios = require('axios');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// API URL
const API_URL = process.env.API_URL || 'http://localhost:8000/api';

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

async function verifyRockImport() {
  try {
    console.log('Verifying rock import status...');
    
    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from('rocks')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error getting total count:', countError);
      return;
    }
    
    console.log(`Total rocks in database: ${totalCount}`);
    
    // Get count by category
    const { data: rocks, error: rocksError } = await supabase
      .from('rocks')
      .select('category');
    
    if (rocksError) {
      console.error('Error getting rocks:', rocksError);
      return;
    }
    
    // Count by category
    const categoryCounts = {};
    rocks.forEach(rock => {
      const category = rock.category || 'Unknown';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    console.log('\nRocks by category:');
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`${category}: ${count}`);
    });
    
    // Check Ore Samples specifically
    const { data: oreSamples, error: oreError } = await supabase
      .from('rocks')
      .select('*')
      .eq('category', 'Ore Samples');
    
    if (oreError) {
      console.error('Error getting ore samples:', oreError);
      return;
    }
    
    console.log(`\nOre Samples count: ${oreSamples.length}`);
    
    if (oreSamples.length > 0) {
      // Check how many have commodity_type
      const withCommodity = oreSamples.filter(rock => rock.commodity_type).length;
      console.log(`Ore Samples with commodity_type: ${withCommodity}`);
      
      // Check how many have coordinates
      const withCoordinates = oreSamples.filter(rock => rock.coordinates).length;
      console.log(`Ore Samples with coordinates: ${withCoordinates}`);
      
      // Sample of ore samples
      console.log('\nSample Ore Samples:');
      oreSamples.slice(0, 5).forEach(ore => {
        console.log(`- ${ore.rock_code}: ${ore.name}`);
        console.log(`  Commodity: ${ore.commodity_type || 'None'}`);
        console.log(`  Coordinates: ${ore.coordinates || 'None'}`);
      });
    }
    
  } catch (error) {
    console.error('Error verifying rock import:', error);
  }
}

/**
 * Import rocks directly using the API
 * This bypasses the Excel import process and directly adds rocks to the database
 */
async function importRocksAPI(excelFilePath = null) {
  try {
    if (!excelFilePath) {
      // Default to the Database.xlsx file if no path provided
      excelFilePath = path.resolve(__dirname, '../../src/excel/Database.xlsx');
    }

    console.log(`Reading Excel file: ${excelFilePath}`);
    
    // Check if file exists
    if (!fs.existsSync(excelFilePath)) {
      console.error(`Excel file not found: ${excelFilePath}`);
      return;
    }
    
    // Read the Excel file
    const workbook = XLSX.readFile(excelFilePath);
    console.log(`Excel file contains ${workbook.SheetNames.length} sheets: ${workbook.SheetNames.join(', ')}`);
    
    // Process each sheet
    for (const sheetName of workbook.SheetNames) {
      // Skip special sheets (starting with _)
      if (sheetName.startsWith('_')) {
        console.log(`Skipping special sheet: ${sheetName}`);
        continue;
      }
      
      console.log(`\nProcessing sheet: ${sheetName}`);
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      console.log(`Found ${jsonData.length} rows in sheet ${sheetName}`);
      
      // Determine category based on sheet name
      let category = sheetName;
      if (sheetName.toLowerCase().includes('igneous')) category = 'Igneous';
      else if (sheetName.toLowerCase().includes('sedimentary')) category = 'Sedimentary';
      else if (sheetName.toLowerCase().includes('metamorphic')) category = 'Metamorphic';
      else if (sheetName.toLowerCase().includes('ore') || 
               sheetName.toLowerCase().includes('economic')) category = 'Ore Samples';
      
      console.log(`Identified category: ${category}`);
      
      let successCount = 0;
      
      // Process each row in batches
      const BATCH_SIZE = 10;
      for (let i = 0; i < jsonData.length; i += BATCH_SIZE) {
        const batch = jsonData.slice(i, i + BATCH_SIZE);
        console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(jsonData.length/BATCH_SIZE)}...`);
        
        // Process each row in the batch
        for (const row of batch) {
          try {
            // Extract rock name with fallbacks
            let rockName = row['Rock Name'] || row['Name'] || row['Sample Name'] || row['Rock'] || '';
            
            // Special handling for Ore Samples - create proper names based on commodity type
            if (category === 'Ore Samples') {
              const commodityType = row['Type of Commodity'] || row['Commodity Type'] || row['Metal'] || row['Mineral'] || '';
              const rockCode = row['Rock Code'] || '';
              
              if (commodityType && commodityType.trim() !== '') {
                // Create a proper name using commodity type and rock code
                if (rockCode && rockCode.trim() !== '') {
                  rockName = `${commodityType.trim()} (${rockCode.trim()})`;
                } else {
                  rockName = `${commodityType.trim()} Ore Sample`;
                }
              } else if (rockCode && rockCode.trim() !== '') {
                // If no commodity type, use just the rock code
                rockName = `Ore Sample ${rockCode.trim()}`;
              } else {
                // Fallback to generic name
                rockName = `Ore Sample ${i + batch.indexOf(row) + 1}`;
              }
            }
            
            // Skip if no name found (unless it's an ore sample)
            if (!rockName && category !== 'Ore Samples') {
              console.log(`Skipping row - no rock name found`);
              continue;
            }
            
            // Format coordinates
            let coordinates = '';
            if (row['Coordinates'] && row['Coordinates'].toString().trim() !== '') {
              coordinates = row['Coordinates'].toString().trim();
            } else if (row['Latitude'] && row['Longitude'] && 
                      row['Latitude'].toString().trim() !== '' && 
                      row['Longitude'].toString().trim() !== '') {
              coordinates = `${row['Latitude'].toString().trim()}, ${row['Longitude'].toString().trim()}`;
            }
            
            // Create rock object
            const rock = {
              rock_code: row['Rock Code'] || '',
              name: rockName,
              chemical_formula: row['Chemical Formula'] || '',
              hardness: row['Hardness'] || '',
              category: category,
              type: row['Type'] || row['Rock Type'] || '',
              depositional_environment: row['Depositional Environment'] || '',
              grain_size: row['Grain Size'] || '',
              color: row['Color'] || row['Colour'] || '',
              texture: row['Texture'] || '',
              luster: row['Luster'] || '',
              streak: row['Streak'] || '',
              reaction_to_hcl: row['Reaction to HCl'] || row['Reaction to HCL'] || '',
              magnetism: row['Magnetism'] || row['Magnetism '] || '',
              origin: row['Origin'] || '',
              latitude: row['Latitude'] || '',
              longitude: row['Longitude'] || '',
              coordinates: coordinates,
              locality: row['Locality'] || row['Location'] || '',
              mineral_composition: row['Mineral Composition'] || row['Associated Minerals'] || '',
              description: row['Description'] || row['Overall Description'] || '',
              formation: row['Formation'] || '',
              geological_age: row['Geological Age'] || row['Age'] || '',
              status: row['Status'] || 'active',
              image_url: row['Image URL'] || '',
            };
            
            // Ensure rock code is present and properly formatted
            if (!rock.rock_code || rock.rock_code.trim() === '') {
              // Generate based on category
              const prefix = category === 'Igneous' ? 'I-' : 
                             category === 'Sedimentary' ? 'S-' :
                             category === 'Metamorphic' ? 'M-' : 'O-';
              rock.rock_code = `${prefix}${String(i + batch.indexOf(row) + 1).padStart(3, '0')}`;
            } else {
              // Clean up existing rock code format for ore samples
              if (category === 'Ore Samples') {
                let cleanCode = rock.rock_code.trim();
                // Remove extra spaces and ensure proper format
                cleanCode = cleanCode.replace(/\s+/g, '');
                // Ensure it starts with O- and has proper numbering
                if (!cleanCode.startsWith('O-')) {
                  cleanCode = `O-${cleanCode.replace(/^O/, '')}`;
                }
                rock.rock_code = cleanCode;
              }
            }
            
            // Add category-specific fields
            if (category === 'Metamorphic') {
              rock.associated_minerals = row['Associated Minerals'] || '';
              rock.metamorphism_type = row['Metamorphism Type'] || '';
              rock.metamorphic_grade = row['Metamorphic Grade'] || '';
              rock.parent_rock = row['Parent Rock'] || '';
              rock.foliation = row['Foliation'] || '';
              rock.foliation_type = row['Foliation Type'] || '';
            } else if (category === 'Igneous') {
              rock.silica_content = row['Silica Content'] || '';
              rock.cooling_rate = row['Cooling Rate'] || '';
              rock.mineral_content = row['Mineral Content'] || '';
            } else if (category === 'Sedimentary') {
              rock.bedding = row['Bedding'] || '';
              rock.sorting = row['Sorting'] || '';
              rock.roundness = row['Roundness'] || '';
              rock.fossil_content = row['Fossil Content'] || '';
              rock.sediment_source = row['Sediment Source'] || '';
            } else if (category === 'Ore Samples') {
              rock.commodity_type = row['Type of Commodity'] || row['Commodity Type'] || row['Metal'] || row['Mineral'] || row['Type'] || '';
              rock.ore_group = row['Ore Group'] || row['Type of Deposit'] || row['Deposit Type'] || '';
              rock.mining_company = row['Mining Company'] || row['Mining Company/Donated by'] || row['Source'] || '';
            }
            
            // Insert directly with Supabase
            const { data, error } = await supabase
              .from('rocks')
              .upsert(rock, { 
                onConflict: 'rock_code',
                ignoreDuplicates: false
              });
            
            if (error) {
              console.error(`Error adding rock ${rock.name}:`, error);
            } else {
              successCount++;
              console.log(`Added rock: ${rock.name} (${rock.rock_code})`);
            }
          } catch (rowError) {
            console.error(`Error processing row:`, rowError);
          }
        }
      }
      
      console.log(`Successfully imported ${successCount} of ${jsonData.length} rocks from sheet ${sheetName}`);
    }
    
    console.log('\nAPI import completed. Verifying results...');
    await verifyRockImport();
    
  } catch (error) {
    console.error('Error in importRocksAPI:', error);
  }
}

// Main function to analyze the Excel file
async function analyzeExcelFile(filePath) {
  try {
    // Default to the sample file if no path provided
    const excelPath = filePath || path.join(__dirname, '../excel/Database.xlsx');
    console.log(`Analyzing Excel file: ${excelPath}`);
    
    if (!fs.existsSync(excelPath)) {
      console.error(`File not found: ${excelPath}`);
      return;
    }
    
    // Read the Excel file
    const workbook = XLSX.read(fs.readFileSync(excelPath), { type: 'buffer' });
    console.log(`\nExcel file contains ${workbook.SheetNames.length} sheets:`);
    console.log(workbook.SheetNames);
    
    // Analyze each sheet
    workbook.SheetNames.forEach(sheetName => {
      // Skip sheets starting with underscore (typically metadata)
      if (sheetName.startsWith('_')) {
        console.log(`\nSkipping metadata sheet: ${sheetName}`);
        return;
      }
      
      console.log(`\n===== Analyzing sheet: ${sheetName} =====`);
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      console.log(`Found ${jsonData.length} rows in sheet ${sheetName}`);
      
      if (jsonData.length > 0) {
        // Analyze the first row to understand available columns
        const firstRow = jsonData[0];
        console.log('\nAvailable columns:');
        Object.keys(firstRow).forEach(key => {
          console.log(`- ${key}: ${typeof firstRow[key]} (Sample: ${firstRow[key]})`);
        });
        
        // Check for essential columns
        const essentialColumns = ['Rock Name', 'Name', 'Rock Code', 'Type', 'Category'];
        const missingColumns = essentialColumns.filter(col => 
          !Object.keys(firstRow).some(key => key.toLowerCase() === col.toLowerCase())
        );
        
        if (missingColumns.length > 0) {
          console.warn('\nWARNING: Missing essential columns:');
          missingColumns.forEach(col => console.warn(`- ${col}`));
        }
        
        // Sample the data
        console.log('\nSample data (first 2 rows):');
        jsonData.slice(0, 2).forEach((row, index) => {
          console.log(`\nRow ${index + 1}:`);
          Object.entries(row).forEach(([key, value]) => {
            console.log(`  ${key}: ${value}`);
          });
        });
      } else {
        console.warn('No data found in this sheet!');
      }
    });
    
    console.log('\nAnalysis complete!');
    
  } catch (error) {
    console.error('Error analyzing Excel file:', error);
  }
}

// Function to check if rocks exist in Supabase
async function checkRocksInSupabase() {
  try {
    console.log('\nChecking rocks in Supabase...');
    
    // Get count of rocks
    const { count, error: countError } = await supabase
      .from('rocks')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error getting rock count:', countError);
      return;
    }
    
    console.log(`Total rocks in database: ${count}`);
    
    // Get counts by category
    const { data, error } = await supabase
      .from('rocks')
      .select('category');
    
    if (error) {
      console.error('Error getting rock categories:', error);
      return;
    }
    
    // Calculate category counts
    const categoryCounts = data.reduce((acc, item) => {
      const category = item.category || 'Unknown';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\nRocks by category:');
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`- ${category}: ${count}`);
    });
    
    // Get a sample from each category
    console.log('\nSample data from each category:');
    for (const category of Object.keys(categoryCounts)) {
      const { data: sampleData, error: sampleError } = await supabase
        .from('rocks')
        .select('*')
        .eq('category', category)
        .limit(1);
      
      if (sampleError) {
        console.error(`Error getting sample for ${category}:`, sampleError);
        continue;
      }
      
      if (sampleData && sampleData.length > 0) {
        console.log(`\n${category} sample:`);
        const sample = sampleData[0];
        // Print only key fields to avoid overwhelming output
        const keyFields = [
          'id', 'rock_code', 'name', 'category', 'type', 
          'color', 'texture', 'mineral_composition'
        ];
        keyFields.forEach(field => {
          if (sample[field]) {
            console.log(`  ${field}: ${sample[field]}`);
          }
        });
      }
    }
    
  } catch (error) {
    console.error('Error checking rocks in Supabase:', error);
  }
}

// Direct import function for testing
async function importExcelDirectly(filePath) {
  try {
    const excelPath = filePath || path.join(__dirname, '../excel/Database.xlsx');
    console.log(`Importing Excel file: ${excelPath}`);
    
    if (!fs.existsSync(excelPath)) {
      console.error(`File not found: ${excelPath}`);
      return;
    }
    
    // Read the Excel file
    const workbook = XLSX.read(fs.readFileSync(excelPath), { type: 'buffer' });
    const rocks = [];
    
    // Process each sheet
    workbook.SheetNames.forEach((sheetName) => {
      // Skip metadata sheets
      if (sheetName.startsWith('_')) {
        return;
      }
      
      console.log(`Processing sheet: ${sheetName}`);
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      // Determine category based on sheet name
      let category = sheetName;
      if (sheetName.toLowerCase().includes('igneous')) category = 'Igneous';
      else if (sheetName.toLowerCase().includes('sedimentary')) category = 'Sedimentary';
      else if (sheetName.toLowerCase().includes('metamorphic')) category = 'Metamorphic';
      else if (sheetName.toLowerCase().includes('ore')) category = 'Ore Samples';
      
      // Process each row
      jsonData.forEach((row, index) => {
        // Extract rock name
        const rockName = row['Rock Name'] || row['Name'] || row['Sample Name'] || row['Rock'] || '';
        
        if (!rockName && category !== 'Ore Samples') {
          console.log(`Skipping row ${index+1} - no rock name found`);
          return;
        }
        
        // Generate rock code if needed
        let rockCode = row['Rock Code'] || '';
        if (!rockCode) {
          const prefix = category === 'Igneous' ? 'I-' : 
                         category === 'Sedimentary' ? 'S-' :
                         category === 'Metamorphic' ? 'M-' : 'O-';
          rockCode = `${prefix}${String(index + 1).padStart(4, '0')}`;
        }
        
        // Format coordinates
        let coordinates = '';
        if (row['Coordinates']) {
          coordinates = row['Coordinates'];
        } else if (row['Latitude'] && row['Longitude']) {
          coordinates = `${row['Latitude']}, ${row['Longitude']}`;
        }
        
        // Create rock object
        const rock = {
          rock_code: rockCode,
          name: rockName || `${category} Sample ${index+1}`,
          chemical_formula: row['Chemical Formula'] || '',
          hardness: row['Hardness'] || '',
          category: category,
          type: row['Type'] || row['Rock Type'] || category,
          depositional_environment: row['Depositional Environment'] || '',
          grain_size: row['Grain Size'] || '',
          color: row['Color'] || row['Colour'] || '',
          texture: row['Texture'] || '',
          luster: row['Luster'] || '',
          streak: row['Streak'] || '',
          reaction_to_hcl: row['Reaction to HCl'] || '',
          magnetism: row['Magnetism'] || '',
          origin: row['Origin'] || '',
          latitude: row['Latitude'] || '',
          longitude: row['Longitude'] || '',
          coordinates: coordinates,
          locality: row['Locality'] || row['Location'] || '',
          mineral_composition: row['Mineral Composition'] || row['Associated Minerals'] || '',
          description: row['Description'] || row['Overall Description'] || '',
          formation: row['Formation'] || '',
          geological_age: row['Geological Age'] || row['Age'] || '',
          status: 'active'
        };
        
        // Add category-specific fields
        if (category === 'Metamorphic') {
          rock.associated_minerals = row['Associated Minerals'] || '';
          rock.metamorphism_type = row['Metamorphism Type'] || '';
          rock.metamorphic_grade = row['Metamorphic Grade'] || '';
          rock.parent_rock = row['Parent Rock'] || '';
          rock.foliation = row['Foliation'] || '';
        } else if (category === 'Igneous') {
          rock.silica_content = row['Silica Content'] || '';
          rock.cooling_rate = row['Cooling Rate'] || '';
          rock.mineral_content = row['Mineral Content'] || '';
        } else if (category === 'Sedimentary') {
          rock.bedding = row['Bedding'] || '';
          rock.sorting = row['Sorting'] || '';
          rock.roundness = row['Roundness'] || '';
          rock.fossil_content = row['Fossil Content'] || '';
          rock.sediment_source = row['Sediment Source'] || '';
        } else if (category === 'Ore Samples') {
          rock.commodity_type = row['Type of Commodity'] || row['Commodity Type'] || '';
          rock.ore_group = row['Ore Group'] || row['Type of Deposit'] || '';
          rock.mining_company = row['Mining Company'] || row['Mining Company/Donated by'] || '';
        }
        
        rocks.push(rock);
      });
    });
    
    console.log(`Processed ${rocks.length} rocks from Excel file`);
    
    // Insert rocks in batches
    if (rocks.length > 0) {
      const BATCH_SIZE = 50;
      let successCount = 0;
      
      for (let i = 0; i < rocks.length; i += BATCH_SIZE) {
        const batch = rocks.slice(i, i + BATCH_SIZE);
        console.log(`Importing batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(rocks.length/BATCH_SIZE)}...`);
        
        const { data, error } = await supabase
          .from('rocks')
          .upsert(batch, {
            onConflict: 'rock_code',
            ignoreDuplicates: false,
          });
          
        if (error) {
          console.error('Error importing batch:', error);
        } else {
          successCount += batch.length;
          console.log(`Successfully imported ${successCount} of ${rocks.length} rocks so far`);
        }
      }
      
      console.log(`Import complete! ${successCount} rocks imported.`);
    } else {
      console.log('No rocks found to import');
    }
    
  } catch (error) {
    console.error('Error importing rocks:', error);
  }
}

// Command line interface
function run() {
  const command = process.argv[2];
  const filePath = process.argv[3];
  
  if (!command) {
    console.log('Usage:');
    console.log('  node verify-rock-import.js analyze [filepath]  - Analyze Excel file structure');
    console.log('  node verify-rock-import.js check                - Check rocks in Supabase');
    console.log('  node verify-rock-import.js import [filepath]    - Import Excel file directly');
    return;
  }
  
  switch (command.toLowerCase()) {
    case 'analyze':
      analyzeExcelFile(filePath);
      break;
    case 'check':
      checkRocksInSupabase();
      break;
    case 'import':
      importExcelDirectly(filePath);
      break;
    default:
      console.log(`Unknown command: ${command}`);
      break;
  }
}

// Run the script
run(); 