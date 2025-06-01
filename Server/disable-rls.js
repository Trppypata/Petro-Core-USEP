const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY environment variables');
  process.exit(1);
}

console.log('Connecting to Supabase...');
const supabase = createClient(supabaseUrl, supabaseKey);

async function disableRLS() {
  try {
    console.log('Attempting to disable RLS on minerals table...');
    
    // Execute the SQL to disable RLS
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Disable RLS
        ALTER TABLE minerals DISABLE ROW LEVEL SECURITY;
        
        -- Drop all existing policies
        DROP POLICY IF EXISTS "Minerals are viewable by everyone" ON minerals;
        DROP POLICY IF EXISTS "Users can insert their own minerals" ON minerals;
        DROP POLICY IF EXISTS "Users can update their own minerals" ON minerals;
        DROP POLICY IF EXISTS "Users can delete their own minerals" ON minerals;
        DROP POLICY IF EXISTS "Authenticated users can update any mineral" ON minerals;
        DROP POLICY IF EXISTS "Authenticated users can delete any mineral" ON minerals;
        
        -- Grant permissions
        GRANT ALL ON minerals TO authenticated;
        GRANT ALL ON minerals TO anon;
        GRANT ALL ON minerals TO service_role;
      `
    });
    
    if (error) {
      throw new Error(`Failed to disable RLS: ${error.message}`);
    }
    
    console.log('✅ Successfully disabled RLS on minerals table');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the function
disableRLS()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 