import { supabase } from '../config/supabase';
import fs from 'fs';
import path from 'path';

/**
 * Run the migration to create the rock_images table
 */
const runMigration = async () => {
  try {
    console.log('🚀 Running rock_images table migration...');
    
    // Read the SQL file
    const sqlContent = fs.readFileSync(
      path.join(__dirname, 'rock_images_table.sql'),
      'utf-8'
    );
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      throw error;
    }
    
    console.log('✅ rock_images table migration completed successfully!');
  } catch (error) {
    console.error('❌ Error running rock_images migration:', error);
  }
};

// Run the migration
runMigration(); 