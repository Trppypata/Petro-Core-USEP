import * as XLSX from 'xlsx';
import type { IMineral } from '../mineral.interface';
import axios from 'axios';

// Function to parse Excel file
export async function parseExcelToMinerals(
  file: File,
  type: 'mineral' | 'rock' = 'mineral'
): Promise<IMineral[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // We assume each sheet represents a category of minerals
        const minerals: IMineral[] = [];
        
        workbook.SheetNames.forEach((sheetName) => {
          // Skip hidden or special sheets
          if (sheetName.startsWith('_') || sheetName === 'Sheet1') {
            return;
          }
          
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          jsonData.forEach((row: any) => {
            // Skip empty rows
            if (!row['Mineral Code'] && !row['Mineral Name']) {
              return;
            }
            
            minerals.push({
              mineral_code: row['Mineral Code'] || '',
              mineral_name: row['Mineral Name'] || '',
              chemical_formula: row['Chemical Formula'] || '',
              mineral_group: row['Mineral Group'] || '',
              color: row['Color'] || '',
              streak: row['Streak'] || '',
              luster: row['Luster'] || '',
              hardness: row['Hardness'] || '',
              cleavage: row['Cleavage'] || '',
              fracture: row['Fracture'] || '',
              habit: row['Habit'] || '',
              crystal_system: row['Crystal System'] || '',
              category: sheetName,
              type: type,
            });
          });
        });
        
        resolve(minerals);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
}

// Function to import the DK_MINERALS_DATABASE.xlsx file
export async function importDefaultExcelData(): Promise<IMineral[]> {
  try {
    // This would typically fetch from a server
    const response = await fetch('/src/assets/DK_MINERALS_DATABASE.xlsx');
    const arrayBuffer = await response.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    
    const workbook = XLSX.read(data, { type: 'array' });
    const minerals: IMineral[] = [];
    
    workbook.SheetNames.forEach((sheetName) => {
      // Skip hidden or special sheets
      if (sheetName.startsWith('_') || sheetName === 'Sheet1') {
        return;
      }
      
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      jsonData.forEach((row: any) => {
        // Skip empty rows
        if (!row['Mineral Code'] && !row['Mineral Name']) {
          return;
        }
        
        minerals.push({
          mineral_code: row['Mineral Code'] || '',
          mineral_name: row['Mineral Name'] || '',
          chemical_formula: row['Chemical Formula'] || '',
          mineral_group: row['Mineral Group'] || '',
          color: row['Color'] || '',
          streak: row['Streak'] || '',
          luster: row['Luster'] || '',
          hardness: row['Hardness'] || '',
          cleavage: row['Cleavage'] || '',
          fracture: row['Fracture'] || '',
          habit: row['Habit'] || '',
          crystal_system: row['Crystal System'] || '',
          category: sheetName,
          type: 'mineral', // Default to mineral
        });
      });
    });
    
    return minerals;
  } catch (error) {
    console.error('Error importing default Excel data:', error);
    return [];
  }
}