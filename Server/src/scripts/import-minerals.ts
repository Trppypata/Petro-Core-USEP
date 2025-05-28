import * as XLSX from 'xlsx';
import { supabase } from '../config/supabase';
import fs from 'fs';
import path from 'path';

interface IMineral {
  id?: string;
  mineral_code: string;
  mineral_name: string;
  chemical_formula?: string;
  mineral_group: string;
  color?: string;
  streak?: string;
  luster?: string;
  hardness?: string;
  cleavage?: string;
  fracture?: string;
  habit?: string;
  crystal_system?: string;
  category: string;
  type: string;
  specific_gravity?: string;
  transparency?: string;
  occurrence?: string;
  uses?: string;
  image_url?: string;
}

// Import minerals from the default Excel file
async function importMineralsFromExcel() {
  try {
    console.log('Importing minerals from Excel...');
    
    // Path to the Excel file
    const excelPath = path.join(__dirname, '../../src/excel/DK_MINERALS_DATABASE.xlsx');
    
    if (!fs.existsSync(excelPath)) {
      console.error('Excel file not found at path:', excelPath);
      process.exit(1);
    }
    
    // Read the Excel file
    const workbook = XLSX.read(fs.readFileSync(excelPath), { type: 'buffer' });
    const minerals: IMineral[] = [];
    
    // Process each sheet
    workbook.SheetNames.forEach((sheetName) => {
      // Skip hidden or special sheets
      if (sheetName.startsWith('_') || sheetName === 'Sheet1') {
        return;
      }
      
      console.log(`Processing sheet: ${sheetName}`);
      
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      jsonData.forEach((row: any) => {
        // Skip empty rows
        if (!row['Mineral Name']) {
          return;
        }
        
        // Generate a unique code if one doesn't exist
        const mineralCode = row['Mineral Code'] || `${sheetName.substring(0, 3)}-${row['Mineral Name'].replace(/\s+/g, '').substring(0, 6)}-${Math.floor(Math.random() * 1000)}`;
        
        minerals.push({
          mineral_code: mineralCode,
          mineral_name: row['Mineral Name'] || '',
          chemical_formula: row['Chemical Formula'] || '',
          mineral_group: row['Mineral Group'] || sheetName,
          color: row['Color'] || '',
          streak: row['Streak'] || '',
          luster: row['Luster'] || '',
          hardness: row['Hardness'] || '',
          cleavage: row['Cleavage'] || '',
          fracture: row['Fracture'] || '',
          habit: row['Habit'] || '',
          crystal_system: row['Crystal System'] || '',
          specific_gravity: row['Specific Gravity'] || '',
          transparency: row['Transparency'] || '',
          occurrence: row['Occurrence'] || '',
          uses: row['Uses'] || '',
          category: sheetName,
          type: 'mineral',
          image_url: row['Image URL'] || '',
        });
      });
    });
    
    console.log(`Found ${minerals.length} minerals to import.`);
    
    if (minerals.length === 0) {
      console.error('No minerals found in the Excel file.');
      process.exit(1);
    }
    
    // Import minerals to the database in batches
    const BATCH_SIZE = 100;
    let successCount = 0;
    
    for (let i = 0; i < minerals.length; i += BATCH_SIZE) {
      const batch = minerals.slice(i, i + BATCH_SIZE);
      console.log(`Importing batch ${i/BATCH_SIZE + 1} of ${Math.ceil(minerals.length/BATCH_SIZE)}...`);
      
      const { data, error } = await supabase
        .from('minerals')
        .upsert(batch, {
          onConflict: 'mineral_code',
          ignoreDuplicates: false,
        });
      
      if (error) {
        console.error('Error importing batch:', error);
      } else {
        successCount += batch.length;
        console.log(`Successfully imported batch ${i/BATCH_SIZE + 1}.`);
      }
    }
    
    console.log(`Import completed. Successfully imported ${successCount} out of ${minerals.length} minerals.`);
    process.exit(0);
  } catch (error) {
    console.error('Error importing minerals:', error);
    process.exit(1);
  }
}

// Run the import
importMineralsFromExcel(); 