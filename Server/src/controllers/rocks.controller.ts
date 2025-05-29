import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { IRock } from '../models/rock.model';

// Import rocks from Excel file
export const importRocksFromExcel = async (req: Request, res: Response) => {
  try {
    const excelFile = req.file;
    
    if (!excelFile) {
      return res.status(400).json({
        success: false,
        message: 'No Excel file uploaded',
      });
    }

    console.log('Starting Excel import process');
    console.log(`File details: ${excelFile.originalname}, ${excelFile.size} bytes, ${excelFile.mimetype}`);

    // Process the uploaded Excel file
    const workbook = XLSX.read(excelFile.buffer, { type: 'buffer' });
    const rocks: IRock[] = [];
    const sheetCounts: Record<string, { total: number, processed: number, skipped: number }> = {};
    
    console.log("Excel file contains the following sheets:");
    console.log(workbook.SheetNames);
    console.log(`Total sheets: ${workbook.SheetNames.length}`);
    
    // Process each sheet
    workbook.SheetNames.forEach((sheetName) => {
      // Skip only special sheets, be more permissive with sheet names
      if (sheetName.startsWith('_')) {
        console.log(`Skipping special sheet: ${sheetName}`);
        return;
      }
      
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      console.log(`Processing sheet: ${sheetName} with ${jsonData.length} entries`);
      sheetCounts[sheetName] = { total: jsonData.length, processed: 0, skipped: 0 };
      
      // Check if the first row exists and log its headers
      if (jsonData.length > 0) {
        console.log(`First row headers for ${sheetName}:`, Object.keys(jsonData[0] as object));
        console.log(`First row sample data:`, jsonData[0]);
      }
      
      jsonData.forEach((row: any, index: number) => {
        // More comprehensive name extraction
        let rockName = row['Rock Name'] || row['Name'] || row['Sample Name'] || row['Rock'] || row['Sample'] || '';
        
        // Special handling for Ore Samples - use Type of Commodity as name if it's the Ore Samples sheet
        const isOreSheet = sheetName.toLowerCase().includes('ore');
        if (isOreSheet && !rockName && row['Type of Commodity']) {
          rockName = `${row['Type of Commodity']} Ore Sample`;
          console.log(`Created name for Ore Sample row ${index+1}: "${rockName}"`);
        }
        
        // Skip only if definitely no rock name found AND not in ore samples sheet
        if (!rockName && !isOreSheet) {
          console.log(`Skipping row ${index+1} in sheet ${sheetName} - no rock name found`);
          sheetCounts[sheetName].skipped++;
          return;
        }
        
        // For Ore Samples sheet, process all rows even without a rock name
        if (!rockName && isOreSheet) {
          rockName = `Ore Sample ${index+1}`;
          console.log(`Generated name for Ore Sample row ${index+1}: "${rockName}"`);
        }
        
        // Enhanced category detection - more flexible
        let category = sheetName;
        if (sheetName.toLowerCase().includes('igneous') || sheetName.toLowerCase().includes('volcanic') || sheetName.toLowerCase().includes('plutonic')) {
          category = 'Igneous';
        } else if (sheetName.toLowerCase().includes('sedimentary') || sheetName.toLowerCase().includes('sediment')) {
          category = 'Sedimentary';
        } else if (sheetName.toLowerCase().includes('metamorphic') || sheetName.toLowerCase().includes('metam')) {
          category = 'Metamorphic';
        } else if (
          sheetName.toLowerCase().includes('ore') || 
          sheetName.toLowerCase().includes('mineral') || 
          sheetName.toLowerCase().includes('economic') ||
          sheetName.toLowerCase().includes('metal') ||
          sheetName.toLowerCase().includes('mining') ||
          sheetName.toLowerCase().includes('deposit') ||
          rockName.toLowerCase().includes('ore') ||
          (row['Commodity Type'] && row['Commodity Type'].toString().trim() !== '') ||
          (row['Type of Commodity'] && row['Type of Commodity'].toString().trim() !== '') ||
          (row['Ore Group'] && row['Ore Group'].toString().trim() !== '') ||
          (row['Type of Deposit'] && row['Type of Deposit'].toString().trim() !== '') ||
          (row['Mining Company'] && row['Mining Company'].toString().trim() !== '') ||
          (row['Mining Company/Donated by'] && row['Mining Company/Donated by'].toString().trim() !== '') ||
          (row['Mining Company/Donated by:'] && row['Mining Company/Donated by:'].toString().trim() !== '')
        ) {
          category = 'Ore Samples';
          console.log(`Identified Ore Sample in sheet ${sheetName}, row ${index+1}, name: ${rockName}`);
        }
        
        // Enhanced coordinates handling
        let coordinates = '';
        // First check if coordinates are already in the data
        if (row['Coordinates'] && row['Coordinates'].toString().trim() !== '') {
          coordinates = row['Coordinates'].toString().trim();
          console.log(`Using explicit coordinates from data: ${coordinates} for rock ${rockName}`);
        } 
        // Then try to build from latitude and longitude
        else if ((row['Latitude'] || row['LAT']) && (row['Longitude'] || row['LONG']) && 
            (row['Latitude'] || row['LAT']).toString().trim() !== '' && 
            (row['Longitude'] || row['LONG']).toString().trim() !== '') {
          const lat = (row['Latitude'] || row['LAT']).toString().trim();
          const long = (row['Longitude'] || row['LONG']).toString().trim();
          coordinates = `${lat}, ${long}`;
          console.log(`Generated coordinates from lat/long: ${coordinates} for rock ${rockName}`);
        }

        // Create rock object with comprehensive field mappings
        const rock: IRock = {
          rock_code: '',
          name: rockName,
          chemical_formula: row['Chemical Formula'] || row['Chemical'] || '',
          hardness: row['Hardness'] || '',
          category: category,
          type: row['Type'] || row['Rock Type'] || '',
          // Sedimentary specific fields - multiple possible header names
          depositional_environment: row['Depositional Environment'] || row['Depositional Env.'] || '',
          grain_size: row['Grain Size'] || '',
          color: row['Color'] || row['Colour'] || '',
          texture: row['Texture'] || '',
          luster: row['Luster'] || '',
          streak: row['Streak'] || '',
          reaction_to_hcl: row['Reaction to HCl'] || row['Reaction to HCL'] || '',
          magnetism: row['Magnetism'] || row['Magnetism '] || '',
          origin: row['Origin'] || '',
          latitude: row['Latitude'] || row['LAT'] || '',
          longitude: row['Longitude'] || row['LONG'] || '',
          coordinates: coordinates,
          locality: row['Locality'] || row['Location'] || '',
          mineral_composition: row['Mineral Composition'] || row['Associated Minerals'] || row['Associated Minerals '] || '',
          description: row['Description'] || row['Overall Description'] || '',
          formation: row['Formation'] || '',
          geological_age: row['Geological Age'] || row['Age'] || '',
          status: row['Status'] || 'active',
          image_url: row['Image URL'] || '',
          // Sedimentary specific fields with more explicit mapping
          bedding: row['Bedding'] || '',
          sorting: row['Sorting'] || '',
          roundness: row['Roundness'] || '',
          fossil_content: row['Fossil Content'] || row['Fossils'] || '',
          sediment_source: row['Sediment Source'] || '',
        };
        
        // Ensure all rocks have a rock_code
        if (!rock.rock_code || rock.rock_code.trim() === '') {
          // For ore samples, use O-XXXX format
          if (category === 'Ore Samples') {
            rock.rock_code = `O-${String(index + 1).padStart(4, '0')}`;
          } else {
            // For other rocks, use first letter of category + index
            rock.rock_code = `${category.charAt(0)}-${String(index + 1).padStart(4, '0')}`;
          }
          console.log(`Generated rock code ${rock.rock_code} for ${rockName}`);
        }
        
        // Add category-specific fields
        if (category === 'Metamorphic') {
          rock.associated_minerals = row['Associated Minerals'] || '';
          rock.metamorphism_type = row['Metamorphism Type'] || row['Metamorpism'] || '';
          rock.metamorphic_grade = row['Metamorphic Grade'] || '';
          rock.parent_rock = row['Parent Rock'] || '';
          rock.protolith = row['Protolith'] || '';
          rock.foliation = row['Foliation'] || '';
          rock.foliation_type = row['Foliation Type'] || '';
        } else if (category === 'Igneous') {
          rock.silica_content = row['Silica Content'] || '';
          rock.cooling_rate = row['Cooling Rate'] || '';
          rock.mineral_content = row['Mineral Content'] || '';
        } else if (category === 'Sedimentary') {
          // Additional fields explicitly mapped for Sedimentary
          rock.bedding = row['Bedding'] || '';
          rock.sorting = row['Sorting'] || '';
          rock.roundness = row['Roundness'] || '';
          rock.fossil_content = row['Fossil Content'] || row['Fossils'] || '';
          rock.sediment_source = row['Sediment Source'] || '';
        } else if (category === 'Ore Samples') {
          // Set ore-specific fields with broader matching
          rock.commodity_type = row['Type of Commodity'] || row['Commodity Type'] || row['Metal'] || row['Mineral'] || row['Type'] || '';
          rock.ore_group = row['Ore Group'] || row['Type of Deposit'] || row['Deposit Type'] || '';
          rock.mining_company = row['Mining Company'] || row['Mining Company/Donated by'] || row['Mining Company/Donated by:'] || row['Source'] || '';
          
          // For Ore Samples, use Commodity Type in the name if name is generic
          if (rockName.startsWith('Ore Sample ') && rock.commodity_type) {
            rock.name = `${rock.commodity_type} Ore Sample`;
          }
          
          // Ensure ore samples always have an O- code
          if (!rock.rock_code || rock.rock_code.trim() === '' || !rock.rock_code.startsWith('O-')) {
            rock.rock_code = `O-${String(index + 1).padStart(4, '0')}`;
          }
          
          // Use Overall Description as description if available
          if (row['Overall Description'] && (!rock.description || rock.description.trim() === '')) {
            rock.description = row['Overall Description'];
          }
          
          console.log(`Processing Ore Sample: ${rock.name}, Code: ${rock.rock_code}, Type: ${rock.commodity_type}`);
        }
        
        // Enhanced debug for sedimentary fields if they're missing
        if (category === 'Sedimentary' && (!rock.bedding || !rock.sorting || !rock.roundness || !rock.fossil_content || !rock.sediment_source)) {
          console.log(`Sedimentary rock ${rock.name} may have missing fields:`, {
            bedding: rock.bedding ? 'Present' : 'Missing',
            sorting: rock.sorting ? 'Present' : 'Missing',
            roundness: rock.roundness ? 'Present' : 'Missing',
            fossil_content: rock.fossil_content ? 'Present' : 'Missing',
            sediment_source: rock.sediment_source ? 'Present' : 'Missing',
          });
        }
        
        rocks.push(rock);
        sheetCounts[sheetName].processed++;
      });
    });
    
    // Log summary before inserting
    console.log(`Total rocks found in Excel: ${rocks.length}`);
    console.log('Sheet counts:', sheetCounts);

    // Insert the rocks into the database
    if (rocks.length > 0) {
      console.log(`Attempting to insert ${rocks.length} rocks...`);
      
      // Try inserting them individually instead of in batches
      let successCount = 0;
      let failedCount = 0;
      let errors: any[] = [];
      
      for (const rock of rocks) {
        try {
          // Check if rock already exists
          const { data: existingRock, error: checkError } = await supabase
            .from('rocks')
            .select('id, rock_code')
            .eq('rock_code', rock.rock_code)
            .limit(1)
            .single();
            
          if (checkError && checkError.code !== 'PGRST116') {
            console.error(`Error checking for existing rock (${rock.rock_code}):`, checkError);
            failedCount++;
            errors.push({
              rock: rock.rock_code,
              error: checkError.message
            });
            continue;
          }
            
          if (existingRock) {
            // Update existing rock
            const { error: updateError } = await supabase
              .from('rocks')
              .update(rock)
              .eq('id', existingRock.id);
                
            if (updateError) {
              console.error(`Error updating rock (${rock.rock_code}):`, updateError);
              failedCount++;
              errors.push({
                rock: rock.rock_code,
                error: updateError.message
              });
            } else {
              successCount++;
              console.log(`Updated rock: ${rock.rock_code}`);
            }
          } else {
            // Insert new rock
            const { error: insertError } = await supabase
              .from('rocks')
              .insert(rock);
                
            if (insertError) {
              console.error(`Error inserting rock (${rock.rock_code}):`, insertError);
              failedCount++;
              errors.push({
                rock: rock.rock_code,
                error: insertError.message
              });
            } else {
              successCount++;
              console.log(`Inserted rock: ${rock.rock_code}`);
            }
          }
        } catch (rockError: any) {
          console.error(`Error processing rock (${rock.rock_code}):`, rockError);
          failedCount++;
          errors.push({
            rock: rock.rock_code,
            error: rockError.message
          });
        }
      }

      return res.status(201).json({
        success: successCount > 0,
        message: `Processed ${successCount} of ${rocks.length} rocks${failedCount > 0 ? ` (${failedCount} failed)` : ''}`,
        counts: sheetCounts,
        totalFound: rocks.length,
        successCount,
        failedCount,
        errors: errors.length > 0 ? errors.slice(0, 10) : [] // Limit to first 10 errors
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'No valid rocks found in the Excel file',
      });
    }
  } catch (error: any) {
    console.error('Import rocks from Excel error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

// Fetch all rocks
export const getAllRocks = async (req: Request, res: Response) => {
  try {
    // Get the category from query parameters
    const { category } = req.query;
    console.log('Fetching rocks with category filter:', category);
    
    // Build the query
    let query = supabase.from('rocks').select('*');
    
    // Apply category filter if provided
    if (category && category !== 'ALL') {
      // Use ilike for case-insensitive matching to prevent issues with casing
      query = query.ilike('category', `%${category}%`);
      console.log(`Filtering rocks by category: ${category} (case-insensitive)`);
    }
    
    // Execute the query with ordering
    const { data, error } = await query.order('name', { ascending: true });

    if (error) {
      console.error('Error fetching rocks:', error);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Log some information about the results
    if (data && data.length > 0) {
      const categories = [...new Set(data.map(rock => rock.category))];
      console.log(`Found ${data.length} rocks with ${categories.length} categories:`);
      console.log('Categories:', categories);
      
      // Count rocks per category
      const categoryCounts = categories.reduce((acc, category) => {
        acc[category] = data.filter(rock => rock.category === category).length;
        return acc;
      }, {});
      console.log('Rocks per category:', categoryCounts);
      
      // Check specifically for Ore Samples
      const oreSamplesCount = data.filter(rock => 
        rock.category === 'Ore Samples' || 
        rock.category === 'ore samples' || 
        rock.category === 'Ore samples'
      ).length;
      console.log('Ore Samples count (case variants):', oreSamplesCount);
      
      // Check for coordinates
      const withCoordinates = data.filter(rock => rock.coordinates).length;
      const withLatLong = data.filter(rock => rock.latitude && rock.longitude).length;
      console.log('Rocks with coordinates field:', withCoordinates);
      console.log('Rocks with latitude & longitude:', withLatLong);
      
      // If specifically requesting Ore Samples, log the first few
      if (category === 'Ore Samples' && oreSamplesCount > 0) {
        console.log('Sample Ore Samples:', data.filter(rock => 
          rock.category === 'Ore Samples' || 
          rock.category === 'ore samples' || 
          rock.category === 'Ore samples'
        ).slice(0, 3));
      }
    } else {
      console.log('No rocks found with the provided criteria');
    }

    // If we're filtering by Ore Samples but found none, check for case variations
    if (category === 'Ore Samples' && (!data || data.length === 0)) {
      console.log('No Ore Samples found, checking for case variations...');
      const { data: altData, error: altError } = await supabase
        .from('rocks')
        .select('*')
        .or('category.ilike.%ore samples%,category.ilike.%Ore Samples%')
        .order('name', { ascending: true });
        
      if (!altError && altData && altData.length > 0) {
        console.log(`Found ${altData.length} rocks with case-insensitive Ore Samples search`);
        
        // Fix the category to ensure consistent casing
        const fixedData = altData.map(rock => ({
          ...rock,
          category: 'Ore Samples' // Ensure consistent casing
        }));
        
        return res.status(200).json({
          success: true,
          data: fixedData,
        });
      }
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Fetch rocks error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Add a new rock
export const addRock = async (req: Request, res: Response) => {
  try {
    const rockData: IRock = req.body;
    
    if (!rockData.name || !rockData.category) {
      return res.status(400).json({
        success: false,
        message: 'Rock name and category are required',
      });
    }

    // Generate rock code if not provided
    if (!rockData.rock_code) {
      const { data: existingRocks } = await supabase
        .from('rocks')
        .select('rock_code')
        .eq('category', rockData.category);
      
      const count = (existingRocks?.length || 0) + 1;
      const prefix = rockData.category === 'Ore Samples' ? 'O' : rockData.category.charAt(0);
      rockData.rock_code = `${prefix}-${String(count).padStart(4, '0')}`;
    }

    const { data, error } = await supabase
      .from('rocks')
      .insert(rockData)
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
    console.error('Add rock error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Update a rock
export const updateRock = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rockData: Partial<IRock> = req.body;
    
    const { data, error } = await supabase
      .from('rocks')
      .update(rockData)
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
    console.error('Update rock error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Delete a rock
export const deleteRock = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('rocks')
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
      message: 'Rock deleted successfully',
    });
  } catch (error) {
    console.error('Delete rock error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get rock statistics
export const getRockStats = async (_req: Request, res: Response) => {
  try {
    // Get total count of rocks
    const { count: totalCount, error: countError } = await supabase
      .from('rocks')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error getting rock count:', countError);
      return res.status(400).json({
        success: false,
        message: countError.message,
      });
    }
    
    // Get counts by category
    const { data: categoryData, error: categoryError } = await supabase
      .from('rocks')
      .select('category');
      
    if (categoryError) {
      console.error('Error getting rock categories:', categoryError);
      return res.status(400).json({
        success: false,
        message: categoryError.message,
      });
    }
    
    // Calculate category counts
    const categoryCounts = categoryData.reduce((acc: Record<string, number>, item) => {
      const category = item.category || 'Unknown';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
    
    // Get sample rocks from each category for verification
    const categories = Object.keys(categoryCounts);
    const samples: Record<string, any[]> = {};
    
    for (const category of categories) {
      const { data: sampleData, error: sampleError } = await supabase
        .from('rocks')
        .select('*')
        .eq('category', category)
        .limit(3);
        
      if (!sampleError && sampleData) {
        samples[category] = sampleData;
      }
    }
    
    return res.status(200).json({
      success: true,
      stats: {
        totalCount,
        categoryCounts,
        samples
      }
    });
  } catch (error) {
    console.error('Get rock stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Import default rocks from the server's excel file
export const importDefaultRocks = async (_req: Request, res: Response) => {
  try {
    const excelPath = path.join(__dirname, '../../src/excel/Database.xlsx');
    
    if (!fs.existsSync(excelPath)) {
      return res.status(404).json({
        success: false,
        message: 'Default rocks Excel file not found at: ' + excelPath,
      });
    }

    console.log(`Reading default rocks file from: ${excelPath}`);
    
    // Read the Excel file
    const workbook = XLSX.read(fs.readFileSync(excelPath), { type: 'buffer' });
    const rocks: IRock[] = [];
    const sheetCounts: Record<string, { total: number, processed: number, skipped: number }> = {};
    
    console.log("Excel file contains the following sheets:");
    console.log(workbook.SheetNames);
    console.log(`Total sheets: ${workbook.SheetNames.length}`);
    
    // Process each sheet (reusing the same logic as in importRocksFromExcel)
    workbook.SheetNames.forEach((sheetName) => {
      // Skip only special sheets
      if (sheetName.startsWith('_')) {
        console.log(`Skipping special sheet: ${sheetName}`);
        return;
      }
      
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      console.log(`Processing sheet: ${sheetName} with ${jsonData.length} entries`);
      sheetCounts[sheetName] = { total: jsonData.length, processed: 0, skipped: 0 };
      
      if (jsonData.length > 0) {
        console.log(`First row headers for ${sheetName}:`, Object.keys(jsonData[0] as object));
      }
      
      jsonData.forEach((row: any, index: number) => {
        // Name extraction
        const rockName = row['Rock Name'] || row['Name'] || row['Sample Name'] || row['Rock'] || row['Sample'] || '';
        
        if (!rockName) {
          console.log(`Skipping row ${index+1} in sheet ${sheetName} - no rock name found`);
          sheetCounts[sheetName].skipped++;
          return;
        }
        
        // Category detection
        let category = sheetName;
        if (sheetName.toLowerCase().includes('igneous') || sheetName.toLowerCase().includes('volcanic') || sheetName.toLowerCase().includes('plutonic')) {
          category = 'Igneous';
        } else if (sheetName.toLowerCase().includes('sedimentary') || sheetName.toLowerCase().includes('sediment')) {
          category = 'Sedimentary';
        } else if (sheetName.toLowerCase().includes('metamorphic') || sheetName.toLowerCase().includes('metam')) {
          category = 'Metamorphic';
        } else if (
          sheetName.toLowerCase().includes('ore') || 
          sheetName.toLowerCase().includes('mineral') || 
          sheetName.toLowerCase().includes('economic') ||
          sheetName.toLowerCase().includes('metal') ||
          sheetName.toLowerCase().includes('mining') ||
          sheetName.toLowerCase().includes('deposit') ||
          rockName.toLowerCase().includes('ore') ||
          (row['Commodity Type'] && row['Commodity Type'].toString().trim() !== '') ||
          (row['Type of Commodity'] && row['Type of Commodity'].toString().trim() !== '') ||
          (row['Ore Group'] && row['Ore Group'].toString().trim() !== '') ||
          (row['Type of Deposit'] && row['Type of Deposit'].toString().trim() !== '') ||
          (row['Mining Company'] && row['Mining Company'].toString().trim() !== '') ||
          (row['Mining Company/Donated by'] && row['Mining Company/Donated by'].toString().trim() !== '') ||
          (row['Mining Company/Donated by:'] && row['Mining Company/Donated by:'].toString().trim() !== '')
        ) {
          category = 'Ore Samples';
          console.log(`Identified Ore Sample in sheet ${sheetName}, row ${index+1}, name: ${rockName}`);
        }
        
        // Enhanced coordinates handling
        let coordinates = '';
        // First check if coordinates are already in the data
        if (row['Coordinates'] && row['Coordinates'].toString().trim() !== '') {
          coordinates = row['Coordinates'].toString().trim();
          console.log(`Using explicit coordinates from data: ${coordinates} for rock ${rockName}`);
        } 
        // Then try to build from latitude and longitude
        else if (row['Latitude'] && row['Longitude'] && 
            row['Latitude'].toString().trim() !== '' && 
            row['Longitude'].toString().trim() !== '') {
          coordinates = `${row['Latitude'].toString().trim()}, ${row['Longitude'].toString().trim()}`;
          console.log(`Generated coordinates from lat/long: ${coordinates} for rock ${rockName}`);
        }

        const rock: IRock = {
          rock_code: '',
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
          mineral_composition: row['Mineral Composition'] || row['Associated Minerals'] || row['Associated Minerals '] || '',
          description: row['Description'] || row['Overall Description'] || '',
          formation: row['Formation'] || '',
          geological_age: row['Geological Age'] || row['Age'] || '',
          status: row['Status'] || 'active',
          image_url: row['Image URL'] || '',
        };
        
        // Ensure all rocks have a rock_code
        if (!rock.rock_code || rock.rock_code.trim() === '') {
          // For ore samples, use O-XXXX format
          if (category === 'Ore Samples') {
            rock.rock_code = `O-${String(index + 1).padStart(4, '0')}`;
          } else {
            // For other rocks, use first letter of category + index
            rock.rock_code = `${category.charAt(0)}-${String(index + 1).padStart(4, '0')}`;
          }
          console.log(`Generated rock code ${rock.rock_code} for ${rockName}`);
        }
        
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
          rock.commodity_type = row['Commodity Type'] || row['Type of Commodity'] || row['Metal'] || row['Mineral'] || row['Type'] || '';
          rock.ore_group = row['Ore Group'] || row['Type of Deposit'] || row['Deposit Type'] || '';
          rock.mining_company = row['Mining Company'] || row['Mining Company/Donated by'] || row['Mining Company/Donated by:'] || row['Source'] || '';
          
          // Ensure ore samples always have an O- code
          if (!rock.rock_code || rock.rock_code.trim() === '' || !rock.rock_code.startsWith('O-')) {
            rock.rock_code = `O-${String(index + 1).padStart(4, '0')}`;
          }
          
          console.log(`Processing Ore Sample: ${rock.name}, Code: ${rock.rock_code}, Type: ${rock.commodity_type}`);
        }
        
        rocks.push(rock);
        sheetCounts[sheetName].processed++;
      });
    });
    
    console.log(`Total rocks found in Excel: ${rocks.length}`);
    console.log('Sheet counts:', sheetCounts);

    // Insert the rocks
    if (rocks.length > 0) {
      console.log(`Attempting to insert ${rocks.length} rocks...`);
      
      const BATCH_SIZE = 100;
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
          console.error('Error inserting rocks batch:', error);
          return res.status(400).json({
            success: false,
            message: `Error: ${error.message}. This may be due to row-level security policies or data format issues.`,
          });
        }
        
        successCount += batch.length;
        console.log(`Successfully imported ${successCount} of ${rocks.length} rocks so far`);
      }

      return res.status(201).json({
        success: true,
        message: `Successfully imported ${successCount} rocks from default file`,
        counts: sheetCounts,
        totalFound: rocks.length
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'No valid rocks found in the default Excel file',
      });
    }
  } catch (error: any) {
    console.error('Import default rocks error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

/**
 * Import rocks directly from client-processed Excel data
 */
export const importRocksDirectly = async (req: Request, res: Response) => {
  try {
    const rocksData = req.body;
    
    if (!Array.isArray(rocksData) || rocksData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request: expected an array of rock data'
      });
    }
    
    console.log(`Received direct import request with ${rocksData.length} rocks`);
    
    // Track success and failure counts
    let totalProcessed = 0;
    let failedItems = 0;
    let errors: any[] = [];
    
    // Enhanced debugging - log sample of incoming data
    if (rocksData.length > 0) {
      console.log('Sample rock data for debugging:');
      const sampleRock = rocksData[0];
      console.log(JSON.stringify({
        name: sampleRock.name,
        rock_code: sampleRock.rock_code,
        category: sampleRock.category,
        type: sampleRock.type,
        // Fields that are often missing
        sorting: sampleRock.sorting,
        bedding: sampleRock.bedding,
        roundness: sampleRock.roundness,
        fossil_content: sampleRock.fossil_content,
        sediment_source: sampleRock.sediment_source,
        grain_size: sampleRock.grain_size,
        depositional_environment: sampleRock.depositional_environment,
        texture: sampleRock.texture
      }, null, 2));
    }
    
    // Process each rock individually to avoid transaction failures
    for (const rockData of rocksData) {
      try {
        // Ensure category is properly set
        if (!rockData.category) {
          rockData.category = 'Unknown';
        }
        
        // Ensure rock code is present and clean
        if (!rockData.rock_code || rockData.rock_code.trim() === '') {
          // Generate a default rock code if missing
          const prefix = rockData.category === 'Igneous' ? 'I-' : 
                       rockData.category === 'Sedimentary' ? 'S-' :
                       rockData.category === 'Metamorphic' ? 'M-' : 'O-';
          
          rockData.rock_code = `${prefix}${String(Math.floor(Math.random() * 9000) + 1000)}`;
        }
        
        // Clean rock code (remove spaces)
        rockData.rock_code = rockData.rock_code.replace(/\s+/g, '');
        
        // Add proper defaults for missing fields based on category
        if (rockData.category === 'Sedimentary') {
          // Ensure critical sedimentary fields have at least empty string values
          rockData.bedding = rockData.bedding || '';
          rockData.sorting = rockData.sorting || '';
          rockData.roundness = rockData.roundness || '';
          rockData.fossil_content = rockData.fossil_content || '';
          rockData.sediment_source = rockData.sediment_source || '';
          rockData.grain_size = rockData.grain_size || '';
          rockData.depositional_environment = rockData.depositional_environment || '';
        } else if (rockData.category === 'Igneous') {
          rockData.silica_content = rockData.silica_content || '';
          rockData.cooling_rate = rockData.cooling_rate || '';
          rockData.mineral_content = rockData.mineral_content || '';
        } else if (rockData.category === 'Metamorphic') {
          rockData.metamorphism_type = rockData.metamorphism_type || '';
          rockData.metamorphic_grade = rockData.metamorphic_grade || '';
          rockData.parent_rock = rockData.parent_rock || '';
          rockData.foliation = rockData.foliation || '';
          rockData.foliation_type = rockData.foliation_type || '';
        } else if (rockData.category === 'Ore Samples') {
          rockData.commodity_type = rockData.commodity_type || '';
          rockData.ore_group = rockData.ore_group || '';
          rockData.mining_company = rockData.mining_company || '';
        }
        
        // Ensure common fields have at least empty values
        rockData.texture = rockData.texture || '';
        rockData.color = rockData.color || '';
        rockData.hardness = rockData.hardness || '';
        rockData.description = rockData.description || '';
        rockData.locality = rockData.locality || '';
        rockData.type = rockData.type || '';
        
        // Check if a rock with this code already exists
        const { data: existingRock, error: findError } = await supabase
          .from('rocks')
          .select('id, rock_code')
          .eq('rock_code', rockData.rock_code)
          .limit(1)
          .single();
        
        if (findError && findError.code !== 'PGRST116') {
          // PGRST116 means "no rows returned" which is fine - it means no duplicate
          console.error(`Error checking for existing rock (${rockData.rock_code}):`, findError);
          errors.push({
            rock: rockData.rock_code,
            error: findError.message
          });
          failedItems++;
          continue;
        }
        
        // Log the rock data being inserted/updated
        console.log(`Processing ${existingRock ? 'update' : 'insert'} for rock ${rockData.rock_code} (${rockData.name})`);
        
        if (existingRock) {
          // Update existing rock
          const { data: updatedRock, error: updateError } = await supabase
            .from('rocks')
            .update(rockData)
            .eq('id', existingRock.id)
            .select()
            .single();
          
          if (updateError) {
            console.error(`Error updating rock (${rockData.rock_code}):`, updateError);
            errors.push({
              rock: rockData.rock_code,
              error: updateError.message,
              data: JSON.stringify({
                name: rockData.name,
                category: rockData.category,
                type: rockData.type
              })
            });
            failedItems++;
          } else {
            console.log(`Updated rock: ${rockData.rock_code}`);
            totalProcessed++;
          }
        } else {
          // Insert new rock
          const { data: newRock, error: insertError } = await supabase
            .from('rocks')
            .insert(rockData)
            .select()
            .single();
          
          if (insertError) {
            console.error(`Error inserting rock (${rockData.rock_code}):`, insertError);
            errors.push({
              rock: rockData.rock_code,
              error: insertError.message,
              data: JSON.stringify({
                name: rockData.name,
                category: rockData.category,
                type: rockData.type
              })
            });
            failedItems++;
          } else {
            console.log(`Inserted new rock: ${rockData.rock_code}`);
            totalProcessed++;
          }
        }
      } catch (rockError: any) {
        console.error(`Error processing rock (${rockData.rock_code || 'unknown'}):`, rockError);
        errors.push({
          rock: rockData.rock_code || 'unknown',
          error: rockError.message,
          data: JSON.stringify({
            name: rockData.name,
            category: rockData.category,
            type: rockData.type
          })
        });
        failedItems++;
      }
    }
    
    // Log detailed summary
    console.log(`Import completed: ${totalProcessed} successful, ${failedItems} failed`);
    if (errors.length > 0) {
      console.log(`Sample errors (${errors.length} total):`);
      errors.slice(0, 3).forEach((err, i) => console.log(`Error ${i+1}:`, err));
    }
    
    if (totalProcessed === 0 && errors.length > 0) {
      // All items failed
      return res.status(500).json({
        success: false,
        message: 'Failed to import any rocks',
        totalProcessed,
        failedItems,
        errors: errors.slice(0, 10) // Limit number of errors returned
      });
    }
    
    return res.status(200).json({
      success: true,
      message: `Successfully processed ${totalProcessed} rocks with ${failedItems} failures`,
      totalProcessed,
      failedItems,
      errors: errors.length > 0 ? errors.slice(0, 10) : [] // Limit number of errors returned
    });
  } catch (error: any) {
    console.error('Error in importRocksDirectly:', error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`,
      error: error.message
    });
  }
}; 