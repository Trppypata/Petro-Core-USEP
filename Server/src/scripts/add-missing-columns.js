const { createClient } = require('@supabase/supabase-js');
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
 * Add missing columns to the rocks table
 */
async function addMissingColumns() {
  try {
    console.log('Adding missing columns to the rocks table...');
    
    // Check if the columns exist
    const { data: columnInfo, error: columnError } = await supabase
      .rpc('get_columns_info', { table_name: 'rocks' });
    
    if (columnError) {
      console.error('Error checking columns:', columnError);
      
      // Fallback - try direct column add without checking
      console.log('Attempting to add columns directly...');
      
      try {
        // Add coordinates column
        await supabase.from('rocks').alter('add', { coordinates: 'text' });
        console.log('Added coordinates column (or it already exists)');
        
        // Add reaction_to_hcl column
        await supabase.from('rocks').alter('add', { reaction_to_hcl: 'text' });
        console.log('Added reaction_to_hcl column (or it already exists)');
        
        // Add foliation_type column
        await supabase.from('rocks').alter('add', { foliation_type: 'text' });
        console.log('Added foliation_type column (or it already exists)');
      } catch (alterError) {
        console.error('Error adding columns directly:', alterError);
        console.log('Manual database changes may be required. Please add these columns to your rocks table:');
        console.log('1. coordinates (TEXT)');
        console.log('2. reaction_to_hcl (TEXT)');
        console.log('3. foliation_type (TEXT)');
      }
      
      return;
    }
    
    // Get column names from the result
    const columnNames = (columnInfo || []).map(col => col.column_name);
    console.log('Existing columns:', columnNames.join(', '));
    
    // Check if coordinates column exists
    if (!columnNames.includes('coordinates')) {
      console.log('Adding coordinates column...');
      try {
        const { error } = await supabase.rpc('execute_sql', { 
          sql: 'ALTER TABLE rocks ADD COLUMN coordinates TEXT;' 
        });
        if (error) throw error;
        console.log('Added coordinates column successfully');
      } catch (error) {
        console.error('Error adding coordinates column:', error);
      }
    } else {
      console.log('coordinates column already exists');
    }
    
    // Check if reaction_to_hcl column exists
    if (!columnNames.includes('reaction_to_hcl')) {
      console.log('Adding reaction_to_hcl column...');
      try {
        const { error } = await supabase.rpc('execute_sql', { 
          sql: 'ALTER TABLE rocks ADD COLUMN reaction_to_hcl TEXT;' 
        });
        if (error) throw error;
        console.log('Added reaction_to_hcl column successfully');
      } catch (error) {
        console.error('Error adding reaction_to_hcl column:', error);
      }
    } else {
      console.log('reaction_to_hcl column already exists');
    }
    
    // Check if foliation_type column exists
    if (!columnNames.includes('foliation_type')) {
      console.log('Adding foliation_type column...');
      try {
        const { error } = await supabase.rpc('execute_sql', { 
          sql: 'ALTER TABLE rocks ADD COLUMN foliation_type TEXT;' 
        });
        if (error) throw error;
        console.log('Added foliation_type column successfully');
      } catch (error) {
        console.error('Error adding foliation_type column:', error);
      }
    } else {
      console.log('foliation_type column already exists');
    }
    
    // Create index on rock name if needed
    try {
      console.log('Creating index on rock name...');
      const { error } = await supabase.rpc('execute_sql', { 
        sql: 'CREATE INDEX IF NOT EXISTS rocks_name_idx ON rocks (name);' 
      });
      if (error) throw error;
      console.log('Created index successfully (or it already exists)');
    } catch (error) {
      console.error('Error creating index:', error);
    }
    
  } catch (error) {
    console.error('Error in addMissingColumns:', error);
  }
}

// Main function to run all schema updates
async function main() {
  try {
    await addMissingColumns();
    console.log('Schema update completed successfully!');
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

// Run the main function
main(); 