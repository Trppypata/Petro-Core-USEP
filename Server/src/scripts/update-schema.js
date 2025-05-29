const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Run SQL schema updates
 */
async function updateSchema() {
  try {
    console.log('Updating database schema...');
    
    // Read the SQL file
    const sqlFilePath = path.resolve(__dirname, '../db/update_rocks_columns.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL via Supabase
    const { error } = await supabase.rpc('pgmail_exec', { query: sqlContent });
    
    if (error) {
      console.error('Error executing SQL:', error);
      
      // Try alternate method if the RPC method fails
      console.log('Trying alternate method...');
      
      // Split the SQL into separate statements
      const statements = sqlContent
        .replace(/--.*$/gm, '') // Remove comments
        .split(';')
        .filter(stmt => stmt.trim() !== '')
        .map(stmt => stmt.trim() + ';');
      
      console.log(`Found ${statements.length} SQL statements to execute`);
      
      // Execute each statement separately
      for (const [index, statement] of statements.entries()) {
        console.log(`Executing statement ${index + 1}...`);
        const { error: stmtError } = await supabase.rpc('pgmail_exec', { query: statement });
        
        if (stmtError) {
          console.error(`Error executing statement ${index + 1}:`, stmtError);
          console.log('Statement:', statement);
        } else {
          console.log(`Statement ${index + 1} executed successfully`);
        }
      }
    } else {
      console.log('Schema update SQL executed successfully!');
    }
    
    // Verify the columns were added
    console.log('Verifying column additions...');
    
    // Execute a simple query to get column names
    const { data, error: queryError } = await supabase
      .from('rocks')
      .select()
      .limit(1);
    
    if (queryError) {
      console.error('Error verifying columns:', queryError);
    } else {
      // Check if we have any data
      if (data && data.length > 0) {
        const columnNames = Object.keys(data[0]);
        console.log('Columns present in rocks table:', columnNames.join(', '));
        
        // Check if our new columns are present
        const newColumns = ['coordinates', 'reaction_to_hcl', 'foliation_type'];
        const foundColumns = newColumns.filter(col => columnNames.includes(col));
        const missingColumns = newColumns.filter(col => !columnNames.includes(col));
        
        console.log(`Found ${foundColumns.length} of ${newColumns.length} new columns`);
        if (missingColumns.length > 0) {
          console.warn('Missing columns:', missingColumns.join(', '));
        }
      } else {
        console.warn('No data returned to verify columns');
      }
    }
    
  } catch (error) {
    console.error('Error updating schema:', error);
  }
}

// Run the schema update
updateSchema()
  .then(() => console.log('Schema update process completed'))
  .catch(err => console.error('Schema update process failed:', err)); 