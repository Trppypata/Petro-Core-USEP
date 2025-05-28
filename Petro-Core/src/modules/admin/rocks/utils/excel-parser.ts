import * as XLSX from 'xlsx';
import type { IRock } from '../rock.interface';

// Function to parse Excel file for rocks
export async function parseExcelToRocks(
  file: File
): Promise<IRock[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Each sheet represents a category of rocks (Igneous, Sedimentary, Metamorphic, etc.)
        const rocks: IRock[] = [];
        
        workbook.SheetNames.forEach((sheetName) => {
          // Skip hidden or special sheets
          if (sheetName.startsWith('_') || sheetName === 'Sheet1') {
            return;
          }
          
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          jsonData.forEach((row: any) => {
            // Skip empty rows
            if (!row['Rock Code'] && !row['Rock Name']) {
              return;
            }
            
            rocks.push({
              id: row['Rock Code'] || '',
              name: row['Rock Name'] || '',
              type: row['Type'] || '',
              depositional_environment: row['Depositional Environment'] || '',
              grain_size: row['Grain Size'] || '',
              chemical_formula: row['Chemical Formula'] || '',
              hardness: row['Hardness'] || '',
              color: row['Color'] || '',
              texture: row['Texture'] || '',
              latitude: row['Latitude'] || '',
              longitude: row['Longitude'] || '',
              locality: row['Locality'] || '',
              mineral_composition: row['Mineral Composition'] || '',
              description: row['Description'] || '',
              formation: row['Formation'] || '',
              geological_age: row['Geological Age'] || '',
              category: sheetName,
              status: 'active',
              image_url: ''
            });
          });
        });
        
        resolve(rocks);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
}

// Function to import the Database.xlsx file
export async function importDefaultRockData(): Promise<IRock[]> {
  try {
    // This would typically fetch from a server
    const response = await fetch('/src/assets/Database.xlsx');
    const arrayBuffer = await response.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    
    const workbook = XLSX.read(data, { type: 'array' });
    const rocks: IRock[] = [];
    
    workbook.SheetNames.forEach((sheetName) => {
      // Skip hidden or special sheets
      if (sheetName.startsWith('_') || sheetName === 'Sheet1') {
        return;
      }
      
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      jsonData.forEach((row: any) => {
        // Skip empty rows
        if (!row['Rock Code'] && !row['Rock Name']) {
          return;
        }
        
        rocks.push({
          id: row['Rock Code'] || '',
          name: row['Rock Name'] || '',
          type: row['Type'] || '',
          depositional_environment: row['Depositional Environment'] || '',
          grain_size: row['Grain Size'] || '',
          chemical_formula: row['Chemical Formula'] || '',
          hardness: row['Hardness'] || '',
          color: row['Color'] || '',
          texture: row['Texture'] || '',
          latitude: row['Latitude'] || '',
          longitude: row['Longitude'] || '',
          locality: row['Locality'] || '',
          mineral_composition: row['Mineral Composition'] || '',
          description: row['Description'] || '',
          formation: row['Formation'] || '',
          geological_age: row['Geological Age'] || '',
          category: sheetName,
          status: 'active',
          image_url: ''
        });
      });
    });
    
    return rocks;
  } catch (error) {
    console.error('Error importing default rock data:', error);
    return [];
  }
} 