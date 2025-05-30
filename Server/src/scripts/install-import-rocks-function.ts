import { supabase } from '../config/supabase';
import fs from 'fs';
import path from 'path';

const installImportFunction = async () => {
  try {
    console.log('Installing import_rocks SQL function...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'db', 'import_rocks_function.sql');
    if (!fs.existsSync(sqlPath)) {
      console.error('SQL file not found:', sqlPath);
      process.exit(1);
    }
    
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('SQL function loaded, installing...');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Error installing SQL function:', error);
      process.exit(1);
    }
    
    console.log('import_rocks function installed successfully!');
    console.log('Result:', data);
    
    // Test the function with a simple import
    const testRock = {
      rock_code: 'TEST-001',
      name: 'Test Rock',
      category: 'Test',
      type: 'Test Type'
    };
    
    console.log('Testing function with sample data...');
    const { data: testResult, error: testError } = await supabase.rpc('import_rocks', { 
      rocks_data: [testRock]
    });
    
    if (testError) {
      console.error('Error testing import_rocks function:', testError);
      process.exit(1);
    }
    
    console.log('Function test successful:', testResult);
    process.exit(0);
  } catch (e) {
    console.error('Unhandled error:', e);
    process.exit(1);
  }
};

// Run the installation
installImportFunction(); 