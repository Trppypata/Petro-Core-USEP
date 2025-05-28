import { supabase } from '../config/supabase';
import fs from 'fs';
import path from 'path';

// Main function to execute the migrations
async function setupMineralsTable() {
  try {
    console.log('Setting up minerals table...');
    
    // Read SQL file
    const sqlFilePath = path.join(__dirname, '../migrations/minerals_table.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sqlContent });
    
    if (error) {
      console.error('Error setting up minerals table:', error);
      process.exit(1);
    }
    
    console.log('Minerals table setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error in setup process:', error);
    process.exit(1);
  }
}

// Run the function
setupMineralsTable(); 