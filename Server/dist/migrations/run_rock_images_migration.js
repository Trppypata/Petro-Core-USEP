"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_1 = require("../config/supabase");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Run the migration to create the rock_images table
 */
const runMigration = async () => {
    try {
        console.log('🚀 Running rock_images table migration...');
        // Read the SQL file
        const sqlContent = fs_1.default.readFileSync(path_1.default.join(__dirname, 'rock_images_table.sql'), 'utf-8');
        // Execute the SQL
        const { error } = await supabase_1.supabase.rpc('exec_sql', { sql: sqlContent });
        if (error) {
            throw error;
        }
        console.log('✅ rock_images table migration completed successfully!');
    }
    catch (error) {
        console.error('❌ Error running rock_images migration:', error);
    }
};
// Run the migration
runMigration();
