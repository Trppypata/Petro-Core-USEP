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
        if (!data) {
          throw new Error('Failed to read file data');
        }
        
        console.log('Parsing Excel file:', file.name);
        const workbook = XLSX.read(data, { type: 'binary' });
        
        console.log('Excel sheets:', workbook.SheetNames);
        
        // Each sheet represents a category of rocks (Igneous, Sedimentary, Metamorphic, etc.)
        const rocks: IRock[] = [];
        
        workbook.SheetNames.forEach((sheetName) => {
          // Skip hidden or special sheets
          if (sheetName.startsWith('_') || sheetName === 'Sheet1') {
            console.log('Skipping sheet:', sheetName);
            return;
          }
          
          console.log('Processing sheet:', sheetName);
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          console.log(`Found ${jsonData.length} rows in sheet ${sheetName}`);
          
          if (jsonData.length > 0) {
            console.log('First row headers:', Object.keys(jsonData[0]));
          }
          
          jsonData.forEach((row: any, index: number) => {
            // Get rock name from any of the possible column variants
            const rockName = row['Rock Name'] || row['Name'] || row['Sample Name'] || '';
            
            // Skip empty rows
            if (!rockName) {
              console.log(`Skipping row ${index+1} in sheet ${sheetName} - no rock name found`);
              return;
            }
            
            // Generate a unique code if one doesn't exist
            let rockCode = row['Rock Code'] || row['Code'] || '';
            if (!rockCode) {
              // For ore samples, use O-XXXX format
              if (sheetName === 'Ore Samples') {
                rockCode = `O-${String(index + 1).padStart(4, '0')}`;
              } else {
                // For other rocks, use first letter of category + index
                rockCode = `${sheetName.charAt(0)}-${String(index + 1).padStart(4, '0')}`;
              }
            }
            
            const rock: IRock = {
              id: rockCode,
              rock_code: rockCode,
              name: rockName,
              chemical_formula: row['Chemical Formula'] || '',
              hardness: row['Hardness'] || '',
              category: sheetName,
              type: row['Type'] || row['Rock Type'] || '',
              depositional_environment: row['Depositional Environment'] || '',
              grain_size: row['Grain Size'] || '',
              color: row['Color'] || row['Colour'] || '',
              texture: row['Texture'] || '',
              latitude: row['Latitude'] || '',
              longitude: row['Longitude'] || '',
              locality: row['Locality'] || '',
              mineral_composition: row['Mineral Composition'] || '',
              description: row['Description'] || '',
              formation: row['Formation'] || '',
              geological_age: row['Geological Age'] || row['Age'] || '',
              status: 'active',
              image_url: row['Image URL'] || '',
            };
            
            // Add category-specific fields
            if (sheetName === 'Metamorphic') {
              rock.associated_minerals = row['Associated Minerals'] || '';
              rock.metamorphism_type = row['Metamorphism Type'] || '';
              rock.metamorphic_grade = row['Metamorphic Grade'] || '';
              rock.parent_rock = row['Parent Rock'] || '';
              rock.foliation = row['Foliation'] || '';
            } else if (sheetName === 'Igneous') {
              rock.silica_content = row['Silica Content'] || '';
              rock.cooling_rate = row['Cooling Rate'] || '';
              rock.mineral_content = row['Mineral Content'] || '';
            } else if (sheetName === 'Sedimentary') {
              rock.bedding = row['Bedding'] || '';
              rock.sorting = row['Sorting'] || '';
              rock.roundness = row['Roundness'] || '';
              rock.fossil_content = row['Fossil Content'] || '';
              rock.sediment_source = row['Sediment Source'] || '';
            } else if (sheetName === 'Ore Samples') {
              rock.commodity_type = row['Commodity Type'] || '';
              rock.ore_group = row['Ore Group'] || '';
              rock.mining_company = row['Mining Company'] || '';
            }
            
            rocks.push(rock);
          });
        });
        
        console.log(`Total rocks parsed: ${rocks.length}`);
        resolve(rocks);
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      reject(error);
    };
    
    reader.readAsBinaryString(file);
  });
}

// Function to import the Database.xlsx file
export async function importDefaultRockData(): Promise<IRock[]> {
  try {
    console.log('Attempting to import default rock data');
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
          rock_code: row['Rock Code'] || '',
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