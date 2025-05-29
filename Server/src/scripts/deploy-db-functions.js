#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Check for required environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function deployFunction(sqlFilePath) {
  try {
    console.log(`Deploying SQL function from ${sqlFilePath}...`);
    
    // Read SQL file
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute SQL via Supabase
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error(`Error deploying function: ${error.message}`);
      return false;
    }
    
    console.log(`Successfully deployed function from ${sqlFilePath}`);
    return true;
  } catch (err) {
    console.error(`Error reading or deploying SQL file: ${err.message}`);
    return false;
  }
}

async function main() {
  // Path to the SQL files
  const functionsDir = path.resolve(__dirname, '../db');
  const importMineralsPath = path.join(functionsDir, 'import_minerals_function.sql');
  const importRocksPath = path.join(functionsDir, 'import_rocks_function.sql');
  
  // Check if SQL files exist
  if (!fs.existsSync(importMineralsPath)) {
    console.error(`Error: SQL file not found at ${importMineralsPath}`);
    process.exit(1);
  }
  
  if (!fs.existsSync(importRocksPath)) {
    console.error(`Error: SQL file not found at ${importRocksPath}`);
    process.exit(1);
  }
  
  console.log('Starting deployment of database functions...');
  
  // Create exec_sql function if it doesn't exist
  // This is a helper function to execute arbitrary SQL
  const createHelperFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$;
    
    -- Grant execute permission to service role
    GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;
  `;
  
  try {
    console.log('Creating helper function for SQL execution...');
    const { error } = await supabase.rpc('exec_sql', { sql: createHelperFunctionSQL }).catch(() => {
      // If exec_sql doesn't exist yet, we need to create it directly
      return supabase.from('_temp_sql_execution').rpc('exec', { 
        command: createHelperFunctionSQL 
      });
    });
    
    if (error) {
      console.log('Helper function may not exist yet. Creating directly...');
      // We need to use raw SQL API since we can't use a function that doesn't exist yet
      const { error: directError } = await supabase.from('rpc').select('*').rpc('exec_sql', {
        sql: createHelperFunctionSQL
      });
      
      if (directError) {
        console.error('Failed to create helper function:', directError);
        console.log('Please manually create the exec_sql function using the SQL editor in Supabase.');
      }
    }
  } catch (err) {
    console.error('Error creating helper function:', err);
    console.log('Please manually create the exec_sql function using the SQL editor in Supabase.');
  }
  
  // Deploy the import_minerals function
  console.log('\nDeploying import_minerals function:');
  const mineralSuccess = await deployFunction(importMineralsPath);
  
  // Deploy the import_rocks function
  console.log('\nDeploying import_rocks function:');
  const rockSuccess = await deployFunction(importRocksPath);
  
  if (mineralSuccess && rockSuccess) {
    console.log('\nAll functions deployed successfully!');
    
    // Test the mineral function
    console.log('\nTesting import_minerals function...');
    const testMineralData = [
      {
        mineral_code: "TEST-001",
        mineral_name: "Test Mineral",
        mineral_group: "Test Group",
        category: "TEST",
        type: "mineral"
      }
    ];
    
    try {
      const { data, error } = await supabase.rpc('import_minerals', { 
        minerals_data: testMineralData 
      });
      
      if (error) {
        console.error('Mineral test failed:', error);
      } else {
        console.log('Mineral test successful:', data);
      }
    } catch (testErr) {
      console.error('Error testing mineral function:', testErr);
    }
    
    // Test the rock function
    console.log('\nTesting import_rocks function...');
    const testRockData = [
      {
        rock_code: "TEST-R001",
        name: "Test Rock",
        category: "TEST",
        type: "rock"
      }
    ];
    
    try {
      const { data, error } = await supabase.rpc('import_rocks', { 
        rocks_data: testRockData 
      });
      
      if (error) {
        console.error('Rock test failed:', error);
      } else {
        console.log('Rock test successful:', data);
      }
    } catch (testErr) {
      console.error('Error testing rock function:', testErr);
    }
  } else {
    console.error('Deployment failed. Please check the logs above for errors.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 