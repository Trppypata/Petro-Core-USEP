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
const XLSX = __importStar(require("xlsx"));
const supabase_1 = require("../config/supabase");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Import minerals from the default Excel file
async function importMineralsFromExcel() {
    try {
        console.log('Importing minerals from Excel...');
        // Path to the Excel file
        const excelPath = path_1.default.join(__dirname, '../../src/excel/DK_MINERALS_DATABASE.xlsx');
        if (!fs_1.default.existsSync(excelPath)) {
            console.error('Excel file not found at path:', excelPath);
            process.exit(1);
        }
        // Read the Excel file
        const workbook = XLSX.read(fs_1.default.readFileSync(excelPath), { type: 'buffer' });
        const minerals = [];
        // Process each sheet
        workbook.SheetNames.forEach((sheetName) => {
            // Skip hidden or special sheets
            if (sheetName.startsWith('_') || sheetName === 'Sheet1') {
                return;
            }
            console.log(`Processing sheet: ${sheetName}`);
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            jsonData.forEach((row) => {
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
            console.log(`Importing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(minerals.length / BATCH_SIZE)}...`);
            const { data, error } = await supabase_1.supabase
                .from('minerals')
                .upsert(batch, {
                onConflict: 'mineral_code',
                ignoreDuplicates: false,
            });
            if (error) {
                console.error('Error importing batch:', error);
            }
            else {
                successCount += batch.length;
                console.log(`Successfully imported batch ${i / BATCH_SIZE + 1}.`);
            }
        }
        console.log(`Import completed. Successfully imported ${successCount} out of ${minerals.length} minerals.`);
        process.exit(0);
    }
    catch (error) {
        console.error('Error importing minerals:', error);
        process.exit(1);
    }
}
// Run the import
importMineralsFromExcel();
