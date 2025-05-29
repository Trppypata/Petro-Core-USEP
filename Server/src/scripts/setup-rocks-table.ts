import { supabase } from '../config/supabase';
import fs from 'fs';
import path from 'path';

// Load and execute the SQL script for creating the rocks table
async function setupRocksTable() {
  try {
    console.log('Setting up rocks table...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '../db/create_rocks_table.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL
    const { error } = await supabase.from('rocks').select('count').limit(1).single();
    
    if (error && error.code === 'PGRST116') {
      console.log('Rocks table does not exist. Creating it now...');
      
      // Execute the SQL statements
      const { error: sqlError } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (sqlError) {
        console.error('Error creating rocks table:', sqlError);
        console.log('You may need to execute the SQL directly in the Supabase SQL editor.');
        console.log('SQL file is located at:', sqlFilePath);
      } else {
        console.log('Rocks table created successfully!');
      }
    } else if (error) {
      console.error('Error checking if rocks table exists:', error);
    } else {
      console.log('Rocks table already exists. Skipping creation.');
    }
  } catch (error) {
    console.error('Error setting up rocks table:', error);
  }
}

// Run the setup
setupRocksTable()
  .then(() => {
    console.log('Setup process completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Setup process failed:', error);
    process.exit(1);
  }); 