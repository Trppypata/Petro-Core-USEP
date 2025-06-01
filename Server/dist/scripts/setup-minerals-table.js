"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_1 = require("../config/supabase");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Main function to execute the migrations
async function setupMineralsTable() {
    try {
        console.log('Setting up minerals table...');
        // Read SQL file
        const sqlFilePath = path_1.default.join(__dirname, '../migrations/minerals_table.sql');
        const sqlContent = fs_1.default.readFileSync(sqlFilePath, 'utf8');
        // Execute SQL
        const { error } = await supabase_1.supabase.rpc('exec_sql', { sql_query: sqlContent });
        if (error) {
            console.error('Error setting up minerals table:', error);
            process.exit(1);
        }
        console.log('Minerals table setup completed successfully!');
        process.exit(0);
    }
    catch (error) {
        console.error('Error in setup process:', error);
        process.exit(1);
    }
}
// Run the function
setupMineralsTable();
