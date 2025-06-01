"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_1 = require("../config/supabase");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const addMissingFields = async () => {
    try {
        console.log('Adding missing fields to rocks table...');
        // Path to the SQL file
        const sqlPath = path_1.default.join(__dirname, '..', 'db', 'add_missing_rock_fields.sql');
        console.log('SQL file path:', sqlPath);
        if (!fs_1.default.existsSync(sqlPath)) {
            console.error('SQL file not found:', sqlPath);
            process.exit(1);
        }
        const sql = fs_1.default.readFileSync(sqlPath, 'utf8');
        console.log('SQL migration file loaded');
        // Execute the SQL
        console.log('Executing SQL migration...');
        const { data, error } = await supabase_1.supabase.rpc('exec_sql', { sql_query: sql });
        if (error) {
            console.error('Error executing SQL:', error);
            process.exit(1);
        }
        console.log('Migration completed successfully!');
        console.log('Result:', data);
        // Verify the columns
        const { data: columns, error: columnsError } = await supabase_1.supabase.rpc('exec_sql', {
            sql_query: "SELECT column_name FROM information_schema.columns WHERE table_name = 'rocks' ORDER BY ordinal_position"
        });
        if (columnsError) {
            console.error('Error fetching columns:', columnsError);
            process.exit(1);
        }
        console.log('Current columns in rocks table:');
        columns.forEach((row, i) => console.log(`${i + 1}. ${row.column_name}`));
    }
    catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
};
// Execute the function
addMissingFields().catch(e => {
    console.error('Unhandled error:', e);
    process.exit(1);
});
