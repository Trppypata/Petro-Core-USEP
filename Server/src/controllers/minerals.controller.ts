import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import * as XLSX from 'xlsx';
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

// Import minerals from Excel file
export const importMineralsFromExcel = async (req: Request, res: Response) => {
  try {
    const excelFile = req.file;
    
    if (!excelFile) {
      return res.status(400).json({
        success: false,
        message: 'No Excel file uploaded',
      });
    }

    // Process the uploaded Excel file
    const workbook = XLSX.read(excelFile.buffer, { type: 'buffer' });
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
        if (!row['Mineral Name']) {
          return;
        }
        
        minerals.push({
          mineral_code: row['Mineral Code'] || '',
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

    // Insert the minerals into the database
    if (minerals.length > 0) {
      const { data, error } = await supabase
        .from('minerals')
        .upsert(minerals, {
          onConflict: 'mineral_code',
          ignoreDuplicates: false,
        });

      if (error) {
        console.error('Error inserting minerals:', error);
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(201).json({
        success: true,
        message: `Successfully imported ${minerals.length} minerals`,
        data,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'No valid minerals found in the Excel file',
      });
    }
  } catch (error) {
    console.error('Import minerals from Excel error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Import minerals from the default Excel files in the server
export const importDefaultMinerals = async (_req: Request, res: Response) => {
  try {
    const excelPath = path.join(__dirname, '../../src/excel/DK_MINERALS_DATABASE.xlsx');
    
    if (!fs.existsSync(excelPath)) {
      return res.status(404).json({
        success: false,
        message: 'Default minerals Excel file not found',
      });
    }

    // Read the Excel file
    const workbook = XLSX.read(fs.readFileSync(excelPath), { type: 'buffer' });
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

    // Insert the minerals into the database
    if (minerals.length > 0) {
      // Insert in batches to avoid request size limitations
      const BATCH_SIZE = 50;
      let successCount = 0;
      
      for (let i = 0; i < minerals.length; i += BATCH_SIZE) {
        const batch = minerals.slice(i, i + BATCH_SIZE);
        console.log(`Importing batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(minerals.length/BATCH_SIZE)}...`);
        
        try {
          const { error } = await supabase
            .from('minerals')
            .upsert(batch, {
              onConflict: 'mineral_code',
              ignoreDuplicates: false,
            });
          
          if (error) {
            console.error('Error importing batch:', error);
          } else {
            successCount += batch.length;
          }
        } catch (batchError) {
          console.error('Batch error:', batchError);
        }
      }
      
      return res.status(201).json({
        success: true,
        message: `Successfully imported ${successCount} out of ${minerals.length} minerals`,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'No valid minerals found in the Excel file',
      });
    }
  } catch (error) {
    console.error('Import default minerals error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Fetch all minerals
export const getAllMinerals = async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('minerals')
      .select('*')
      .order('mineral_name', { ascending: true });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Fetch minerals error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Add a new mineral
export const addMineral = async (req: Request, res: Response) => {
  try {
    const mineralData: IMineral = req.body;
    
    if (!mineralData.mineral_name || !mineralData.category) {
      return res.status(400).json({
        success: false,
        message: 'Mineral name and category are required',
      });
    }

    const { data, error } = await supabase
      .from('minerals')
      .insert(mineralData)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Add mineral error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Update a mineral
export const updateMineral = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const mineralData: Partial<IMineral> = req.body;
    
    const { data, error } = await supabase
      .from('minerals')
      .update(mineralData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Update mineral error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Delete a mineral
export const deleteMineral = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('minerals')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Mineral deleted successfully',
    });
  } catch (error) {
    console.error('Delete mineral error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}; 