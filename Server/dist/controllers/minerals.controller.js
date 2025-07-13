"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMineralById = exports.deleteMineral = exports.updateMineral = exports.addMineral = exports.getAllMinerals = exports.importDefaultMinerals = exports.importMineralsFromExcel = void 0;
const supabase_1 = require("../config/supabase");
const XLSX = __importStar(require("xlsx"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Import minerals from Excel file
const importMineralsFromExcel = async (req, res) => {
    try {
        const excelFile = req.file;
        if (!excelFile) {
            return res.status(400).json({
                success: false,
                message: 'No Excel file uploaded',
            });
        }
        // Process the uploaded Excel file
        console.log('Processing Excel file:', excelFile.originalname);
        const workbook = XLSX.read(excelFile.buffer, { type: 'buffer' });
        const minerals = [];
        const sheetCounts = {};
        console.log("Excel file contains the following sheets:");
        console.log(workbook.SheetNames);
        console.log(`Total sheets: ${workbook.SheetNames.length}`);
        // Check specifically for BORATES and CARBONATES sheets (or their singular forms)
        const hasBorates = workbook.SheetNames.some(sheet => sheet.toUpperCase() === 'BORATES' ||
            sheet.toUpperCase() === 'BORATE');
        const hasCarbonates = workbook.SheetNames.some(sheet => sheet.toUpperCase() === 'CARBONATES' ||
            sheet.toUpperCase() === 'CARBONATE');
        console.log(`Borate sheet present (singular or plural): ${hasBorates}`);
        console.log(`Carbonate sheet present (singular or plural): ${hasCarbonates}`);
        // Process each sheet
        workbook.SheetNames.forEach((sheetName) => {
            // Skip only special sheets, be more permissive
            if (sheetName.startsWith('_')) {
                console.log(`Skipping special sheet: ${sheetName}`);
                return;
            }
            // Special logging for our problem sheets
            if (sheetName.toUpperCase() === 'BORATES' ||
                sheetName.toUpperCase() === 'BORATE' ||
                sheetName.toUpperCase() === 'CARBONATES' ||
                sheetName.toUpperCase() === 'CARBONATE') {
                console.log(`Processing special attention sheet: ${sheetName}`);
            }
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            console.log(`Processing sheet: ${sheetName} with ${jsonData.length} entries`);
            sheetCounts[sheetName] = { total: jsonData.length, processed: 0, skipped: 0 };
            // Check if the first row exists and log its headers
            if (jsonData.length > 0) {
                console.log(`First row headers for ${sheetName}:`, Object.keys(jsonData[0]));
            }
            else {
                console.warn(`WARNING: Sheet ${sheetName} has no data rows`);
            }
            jsonData.forEach((row, index) => {
                // More comprehensive name extraction
                const mineralName = row['Mineral Name'] || row['Mineral'] || row['Name'] || row['Sample'] || '';
                // Skip only if definitely no mineral name found
                if (!mineralName) {
                    console.log(`Skipping row ${index + 1} in sheet ${sheetName} - no mineral name found`);
                    sheetCounts[sheetName].skipped++;
                    return;
                }
                // Generate a unique code if one doesn't exist
                const mineralCode = row['Mineral Code'] || `${sheetName.substring(0, 3)}-${mineralName.replace(/\s+/g, '').substring(0, 6)}-${Math.floor(Math.random() * 1000)}`;
                // Handle different column names for various properties
                const chemicalFormula = row['Chemical Formula'] || row['Chemical Formula '] || '';
                const mineralGroup = row['Mineral Group'] || row['Group'] || sheetName;
                const crystalSystem = row['Crystal System'] || row[' Crystal System'] || '';
                const color = row['Color'] || row['Colour'] || '';
                minerals.push({
                    mineral_code: mineralCode,
                    mineral_name: mineralName,
                    chemical_formula: chemicalFormula,
                    mineral_group: mineralGroup,
                    color: color,
                    streak: row['Streak'] || '',
                    luster: row['Luster'] || row['Lustre'] || '',
                    hardness: row['Hardness'] || '',
                    cleavage: row['Cleavage'] || '',
                    fracture: row['Fracture'] || '',
                    habit: row['Habit'] || '',
                    crystal_system: crystalSystem,
                    specific_gravity: row['Specific Gravity'] || '',
                    transparency: row['Transparency'] || '',
                    occurrence: row['Occurrence'] || '',
                    uses: row['Uses'] || '',
                    category: sheetName,
                    type: 'mineral',
                    image_url: row['Image URL'] || '',
                });
                sheetCounts[sheetName].processed++;
            });
        });
        // Log summary before inserting
        console.log(`Total minerals found in Excel: ${minerals.length}`);
        console.log('Sheet counts:', sheetCounts);
        // Insert the minerals into the database
        if (minerals.length > 0) {
            console.log(`Attempting to insert ${minerals.length} minerals...`);
            // Use RPC function to bypass RLS if available
            try {
                const { data, error } = await supabase_1.supabase.rpc('import_minerals', { minerals_data: minerals });
                if (!error) {
                    return res.status(201).json({
                        success: true,
                        message: `Successfully imported ${minerals.length} minerals using RPC`,
                        counts: sheetCounts,
                        data,
                    });
                }
                else {
                    console.log('RPC method failed, falling back to direct insert:', error);
                }
            }
            catch (rpcError) {
                console.log('RPC not available, using direct insert with auth:', rpcError);
            }
            // Fallback to direct insert with auth
            try {
                // Insert in batches with increased batch size
                const BATCH_SIZE = 100;
                let successCount = 0;
                for (let i = 0; i < minerals.length; i += BATCH_SIZE) {
                    const batch = minerals.slice(i, i + BATCH_SIZE);
                    console.log(`Importing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(minerals.length / BATCH_SIZE)}...`);
                    const { data, error } = await supabase_1.supabase
                        .from('minerals')
                        .upsert(batch, {
                        onConflict: 'mineral_code',
                        ignoreDuplicates: false,
                    });
                    if (error) {
                        console.error('Error inserting minerals batch:', error);
                        return res.status(400).json({
                            success: false,
                            message: `Error: ${error.message}. This may be due to row-level security policies or data format issues.`,
                        });
                    }
                    successCount += batch.length;
                    console.log(`Successfully imported ${successCount} of ${minerals.length} minerals so far`);
                }
                return res.status(201).json({
                    success: true,
                    message: `Successfully imported ${successCount} minerals`,
                    counts: sheetCounts,
                    totalFound: minerals.length
                });
            }
            catch (insertError) {
                console.error('Error during batch insert:', insertError);
                return res.status(400).json({
                    success: false,
                    message: insertError.message || 'Failed to insert minerals',
                });
            }
        }
        else {
            return res.status(400).json({
                success: false,
                message: 'No valid minerals found in the Excel file',
            });
        }
    }
    catch (error) {
        console.error('Import minerals from Excel error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error',
        });
    }
};
exports.importMineralsFromExcel = importMineralsFromExcel;
// Import minerals from the default Excel files in the server
const importDefaultMinerals = async (_req, res) => {
    try {
        const excelPath = path_1.default.join(__dirname, '../../src/excel/DK_MINERALS_DATABASE.xlsx');
        if (!fs_1.default.existsSync(excelPath)) {
            return res.status(404).json({
                success: false,
                message: 'Default minerals Excel file not found',
            });
        }
        console.log('Reading default Excel file from:', excelPath);
        // Read the Excel file
        const workbook = XLSX.read(fs_1.default.readFileSync(excelPath), { type: 'buffer' });
        // Debug information about sheets
        console.log("Excel file contains the following sheets:");
        console.log(workbook.SheetNames);
        console.log(`Total sheets: ${workbook.SheetNames.length}`);
        // Check for case variations of sheet names
        const findSheet = (name) => {
            // Check exact match
            if (workbook.SheetNames.includes(name)) {
                return name;
            }
            // Check uppercase
            const upperName = name.toUpperCase();
            if (workbook.SheetNames.includes(upperName)) {
                return upperName;
            }
            // Check lowercase
            const lowerName = name.toLowerCase();
            if (workbook.SheetNames.includes(lowerName)) {
                return lowerName;
            }
            // Check singular/plural variations
            // If looking for plural, check singular too (e.g., "BORATES" -> "BORATE")
            if (name.endsWith('S') && workbook.SheetNames.includes(name.slice(0, -1))) {
                return name.slice(0, -1);
            }
            // If looking for singular, check plural too (e.g., "BORATE" -> "BORATES")
            if (workbook.SheetNames.includes(name + 's')) {
                return name + 's';
            }
            // Check mixed case variations
            return workbook.SheetNames.find(s => s.toLowerCase() === lowerName ||
                s.toLowerCase() === lowerName + 's' ||
                s.toLowerCase() + 's' === lowerName);
        };
        // Check specifically for problematic sheets
        const borateSheet = findSheet('BORATE') || findSheet('BORATES');
        const carbonateSheet = findSheet('CARBONATE') || findSheet('CARBONATES');
        console.log(`Borate sheet found as: ${borateSheet || 'NOT FOUND'}`);
        console.log(`Carbonate sheet found as: ${carbonateSheet || 'NOT FOUND'}`);
        const minerals = [];
        const sheetCounts = {};
        // Process each sheet
        workbook.SheetNames.forEach((sheetName) => {
            // Skip hidden or special sheets
            if (sheetName.startsWith('_') || sheetName === 'Sheet1') {
                console.log(`Skipping sheet: ${sheetName}`);
                return;
            }
            // Special logging for our problem sheets
            if (sheetName.toUpperCase() === 'BORATES' || sheetName.toUpperCase() === 'CARBONATES') {
                console.log(`Processing special attention sheet: ${sheetName}`);
            }
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            console.log(`Processing sheet: ${sheetName} with ${jsonData.length} entries`);
            sheetCounts[sheetName] = jsonData.length;
            // Check if sheet has data
            if (jsonData.length === 0) {
                console.warn(`WARNING: Sheet ${sheetName} has no data rows`);
                return;
            }
            jsonData.forEach((row) => {
                // Skip empty rows
                const mineralName = row['Mineral Name'] || row['Mineral'];
                if (!mineralName) {
                    console.log(`Skipping row with no mineral name: ${JSON.stringify(row).substring(0, 100)}...`);
                    return;
                }
                // Generate a unique code if one doesn't exist
                const mineralCode = row['Mineral Code'] || `${sheetName.substring(0, 3)}-${mineralName.replace(/\s+/g, '').substring(0, 6)}-${Math.floor(Math.random() * 1000)}`;
                // Handle different column names
                const chemicalFormula = row['Chemical Formula'] || row['Chemical Formula '] || '';
                const mineralGroup = row['Mineral Group'] || row['Group'] || sheetName;
                const crystalSystem = row['Crystal System'] || row[' Crystal System'] || '';
                minerals.push({
                    mineral_code: mineralCode,
                    mineral_name: mineralName,
                    chemical_formula: chemicalFormula,
                    mineral_group: mineralGroup,
                    color: row['Color'] || '',
                    streak: row['Streak'] || '',
                    luster: row['Luster'] || '',
                    hardness: row['Hardness'] || '',
                    cleavage: row['Cleavage'] || '',
                    fracture: row['Fracture'] || '',
                    habit: row['Habit'] || '',
                    crystal_system: crystalSystem,
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
        // Log summary before inserting
        console.log(`Total minerals found in Excel: ${minerals.length}`);
        console.log('Sheet counts:', sheetCounts);
        // Insert the minerals into the database
        if (minerals.length > 0) {
            // Insert in batches to avoid request size limitations
            const BATCH_SIZE = 50;
            let successCount = 0;
            for (let i = 0; i < minerals.length; i += BATCH_SIZE) {
                const batch = minerals.slice(i, i + BATCH_SIZE);
                console.log(`Importing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(minerals.length / BATCH_SIZE)}...`);
                try {
                    const { data, error } = await supabase_1.supabase
                        .from('minerals')
                        .upsert(batch, {
                        onConflict: 'mineral_code',
                        ignoreDuplicates: false,
                    })
                        .select();
                    if (error) {
                        console.error('Error importing batch:', error);
                    }
                    else {
                        successCount += data?.length || 0;
                        console.log(`Batch successfully imported, added ${data?.length || 0} minerals`);
                    }
                }
                catch (batchError) {
                    console.error('Batch error:', batchError);
                }
            }
            return res.status(201).json({
                success: true,
                message: `Successfully imported ${successCount} out of ${minerals.length} minerals`,
            });
        }
        else {
            return res.status(400).json({
                success: false,
                message: 'No valid minerals found in the Excel file',
            });
        }
    }
    catch (error) {
        console.error('Import default minerals error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};
exports.importDefaultMinerals = importDefaultMinerals;
// Fetch all minerals
const getAllMinerals = async (req, res) => {
    try {
        // Get the category and pagination parameters from query parameters
        const { category, page = '1', pageSize = '10' } = req.query;
        const pageNum = parseInt(page, 10);
        const pageSizeNum = parseInt(pageSize, 10);
        console.log('Fetching minerals with params:', { category, page: pageNum, pageSize: pageSizeNum });
        // Build the query
        let query = supabase_1.supabase.from('minerals').select('*', { count: 'exact' });
        // Apply category filter if provided
        if (category && category !== 'ALL') {
            console.log(`Original category request: ${category}`);
            // Handle singular/plural variations of category names
            let categoryPattern = category.trim(); // Trim any whitespace
            // Special handling for Borate/Borates and Carbonate/Carbonates
            if (categoryPattern.toUpperCase() === 'BORATE') {
                categoryPattern = 'Borate';
                console.log('Processing special category: Borate (singular)');
            }
            else if (categoryPattern.toUpperCase() === 'BORATES') {
                categoryPattern = 'Borate';
                console.log('Processing special category: Borates (plural) -> using Borate');
            }
            else if (categoryPattern.toUpperCase() === 'CARBONATE') {
                categoryPattern = 'Carbonate';
                console.log('Processing special category: Carbonate (singular)');
            }
            else if (categoryPattern.toUpperCase() === 'CARBONATES') {
                categoryPattern = 'Carbonate';
                console.log('Processing special category: Carbonates (plural) -> using Carbonate');
            }
            // Use ilike for case-insensitive matching with wildcards to handle spaces
            query = query.ilike('category', `%${categoryPattern}%`);
            console.log(`Filtering minerals by normalized category: ${categoryPattern} (using case-insensitive pattern match)`);
        }
        // Get total count first
        const { count, error: countError } = await query;
        if (countError) {
            return res.status(400).json({
                success: false,
                message: countError.message,
            });
        }
        // Calculate pagination values
        const total = count || 0;
        const totalPages = Math.ceil(total / pageSizeNum);
        // Apply pagination
        const from = (pageNum - 1) * pageSizeNum;
        const to = from + pageSizeNum - 1;
        // Execute the query with ordering and pagination
        const { data, error } = await query
            .order('mineral_name', { ascending: true })
            .range(from, to);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }
        // Log some information about the categories for debugging
        if (data && data.length > 0) {
            const categories = [...new Set(data.map(mineral => mineral.category))];
            console.log(`Found ${data.length} minerals with ${categories.length} categories:`);
            console.log('Categories:', categories);
            // Count minerals per category
            const categoryCounts = categories.reduce((acc, category) => {
                acc[category] = data.filter(mineral => mineral.category === category).length;
                return acc;
            }, {});
            console.log('Minerals per category:', categoryCounts);
        }
        else {
            console.log('No minerals found with the provided criteria');
        }
        // Return paginated response
        return res.status(200).json({
            success: true,
            data,
            pagination: {
                total,
                page: pageNum,
                pageSize: pageSizeNum,
                totalPages
            }
        });
    }
    catch (error) {
        console.error('Fetch minerals error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};
exports.getAllMinerals = getAllMinerals;
// Add a new mineral
const addMineral = async (req, res) => {
    try {
        const mineralData = req.body;
        console.log('⭐ Add mineral request received:', JSON.stringify(mineralData, null, 2));
        if (!mineralData.mineral_name || !mineralData.category) {
            return res.status(400).json({
                success: false,
                message: 'Mineral name and category are required',
            });
        }
        // Filter out any undefined or null values
        const filteredData = Object.fromEntries(Object.entries(mineralData).filter(([_, v]) => v !== null && v !== undefined));
        // Explicitly remove any user-related fields for security
        delete filteredData.user;
        delete filteredData.user_id;
        delete filteredData.user_metadata;
        console.log('🧹 Prepared mineral data for insert:', JSON.stringify(filteredData, null, 2));
        // Try RPC function first if available
        try {
            const { data, error } = await supabase_1.supabase.rpc('insert_mineral', {
                mineral_data: filteredData
            });
            if (!error) {
                return res.status(201).json({
                    success: true,
                    data,
                });
            }
            else {
                console.log('RPC method failed, falling back to direct insert:', error);
            }
        }
        catch (rpcError) {
            console.log('RPC not available, using direct insert:', rpcError);
        }
        // If RPC fails, try direct insert
        const { data, error } = await supabase_1.supabase
            .from('minerals')
            .insert(filteredData)
            .select()
            .single();
        if (error) {
            console.error('❌ Error adding mineral:', error);
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }
        return res.status(201).json({
            success: true,
            data,
        });
    }
    catch (error) {
        console.error('Add mineral error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};
exports.addMineral = addMineral;
// Update a mineral
const updateMineral = async (req, res) => {
    try {
        const { id } = req.params;
        const mineralData = req.body;
        console.log('⭐ Update mineral request received for id:', id);
        console.log('⭐ Original mineral data:', JSON.stringify(mineralData, null, 2));
        // Filter out any undefined or null values
        const filteredData = Object.fromEntries(Object.entries(mineralData).filter(([_, v]) => v !== null && v !== undefined));
        // Explicitly remove any user-related fields for security
        delete filteredData.user;
        delete filteredData.user_id;
        delete filteredData.user_metadata;
        console.log('🧹 Prepared mineral data for update:', JSON.stringify(filteredData, null, 2));
        try {
            // Check if the mineral exists first
            const { data: existingMineral, error: findError } = await supabase_1.supabase
                .from('minerals')
                .select('*')
                .eq('id', id)
                .single();
            if (findError) {
                console.error('❌ Error finding mineral:', findError);
                return res.status(404).json({
                    success: false,
                    message: `Mineral with ID ${id} not found`,
                });
            }
            console.log('✅ Found mineral:', existingMineral.mineral_name);
            console.log('📊 Database columns:', Object.keys(existingMineral));
            // Try RPC function first if available
            try {
                const { data, error } = await supabase_1.supabase.rpc('update_mineral', {
                    mineral_id: id,
                    mineral_data: filteredData
                });
                if (!error) {
                    return res.status(200).json({
                        success: true,
                        data,
                    });
                }
                else {
                    console.log('RPC method failed, falling back to direct update:', error);
                }
            }
            catch (rpcError) {
                console.log('RPC not available, using direct update:', rpcError);
            }
            // If RPC fails, try direct update
            const { data, error } = await supabase_1.supabase
                .from('minerals')
                .update(filteredData)
                .eq('id', id)
                .select()
                .single();
            if (error) {
                console.error('❌ Error updating mineral in database:', error);
                return res.status(400).json({
                    success: false,
                    message: error.message,
                });
            }
            return res.status(200).json({
                success: true,
                data,
            });
        }
        catch (dbError) {
            console.error('❌ Database error:', dbError);
            return res.status(400).json({
                success: false,
                message: 'Database error',
            });
        }
    }
    catch (error) {
        console.error('❌ Error in updateMineral controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};
exports.updateMineral = updateMineral;
// Delete a mineral
const deleteMineral = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase_1.supabase
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
    }
    catch (error) {
        console.error('Delete mineral error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};
exports.deleteMineral = deleteMineral;
// Get a single mineral by ID
const getMineralById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Mineral ID is required',
            });
        }
        console.log(`Fetching mineral with ID: ${id}`);
        const { data, error } = await supabase_1.supabase
            .from('minerals')
            .select('*')
            .eq('id', id)
            .single();
        if (error) {
            console.error('Error fetching mineral by ID:', error);
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }
        if (!data) {
            return res.status(404).json({
                success: false,
                message: 'Mineral not found',
            });
        }
        return res.status(200).json({
            success: true,
            data,
        });
    }
    catch (error) {
        console.error('Get mineral by ID error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};
exports.getMineralById = getMineralById;
