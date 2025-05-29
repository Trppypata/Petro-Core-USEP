const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

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

// Run a raw SQL query to add the missing columns
async function updateRocksTable() {
  try {
    console.log('Adding missing columns to rocks table...');
    
    // Run a raw SQL query to add the columns if they don't exist
    const { error } = await supabase.from('rocks').select('id').limit(1);
    
    if (error) {
      console.error('Error accessing rocks table:', error);
      return;
    }
    
    // Define the SQL queries
    const queries = [
      // Check if coordinates column exists
      {
        query: `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'public'
            AND table_name = 'rocks'
            AND column_name = 'coordinates'
        `,
        onEmpty: `ALTER TABLE rocks ADD COLUMN coordinates TEXT;`,
        description: 'coordinates'
      },
      // Check if reaction_to_hcl column exists
      {
        query: `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'public'
            AND table_name = 'rocks'
            AND column_name = 'reaction_to_hcl'
        `,
        onEmpty: `ALTER TABLE rocks ADD COLUMN reaction_to_hcl TEXT;`,
        description: 'reaction_to_hcl'
      },
      // Check if foliation_type column exists
      {
        query: `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'public'
            AND table_name = 'rocks'
            AND column_name = 'foliation_type'
        `,
        onEmpty: `ALTER TABLE rocks ADD COLUMN foliation_type TEXT;`,
        description: 'foliation_type'
      }
    ];
    
    // Execute each query
    for (const { query, onEmpty, description } of queries) {
      try {
        // First check if the column exists
        console.log(`Checking if ${description} column exists...`);
        const { data, error: checkError } = await supabase.rpc('pg_query', { query_text: query });
        
        if (checkError) {
          console.error(`Error checking for ${description} column:`, checkError);
          continue;
        }
        
        // If the column doesn't exist, add it
        if (!data || data.length === 0) {
          console.log(`${description} column doesn't exist, adding it...`);
          const { error: alterError } = await supabase.rpc('pg_query', { query_text: onEmpty });
          
          if (alterError) {
            console.error(`Error adding ${description} column:`, alterError);
          } else {
            console.log(`Added ${description} column successfully`);
          }
        } else {
          console.log(`${description} column already exists`);
        }
      } catch (error) {
        console.error(`Error processing ${description} column:`, error);
      }
    }
    
    console.log('Finished adding missing columns');
    
  } catch (error) {
    console.error('Error updating rocks table:', error);
  }
}

// Run the update
updateRocksTable()
  .then(() => console.log('Rocks table update completed'))
  .catch(error => console.error('Failed to update rocks table:', error)); 