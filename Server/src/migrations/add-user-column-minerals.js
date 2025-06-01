const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Migration: Add user column to the minerals table
 * 
 * This migration adds a 'user' column to the minerals table
 * to support Row Level Security policies
 */
async function migrateAddUserColumn() {
  try {
    console.log('🔄 Starting migration: Add user column to minerals table');
    
    // Check if the column already exists
    const { data: columns, error: columnError } = await supabase
      .from('minerals')
      .select('user')
      .limit(1);
    
    if (!columnError) {
      console.log('✅ The user column already exists in the minerals table');
      return;
    }
    
    // Execute raw SQL to add the column
    // Note: We use the SQL API to add a column with a foreign key constraint
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE minerals
        ADD COLUMN "user" UUID REFERENCES auth.users(id);
      `
    });
    
    if (error) {
      throw new Error(`Failed to add user column: ${error.message}`);
    }
    
    console.log('✅ Successfully added user column to minerals table');
    
    // Create or update RLS policies
    console.log('🔄 Setting up Row Level Security policies for minerals table');
    
    // Enable RLS on the table
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Enable Row Level Security
        ALTER TABLE minerals ENABLE ROW LEVEL SECURITY;
        
        -- Create policy for authenticated users to see all minerals
        DROP POLICY IF EXISTS "Minerals are viewable by everyone" ON minerals;
        CREATE POLICY "Minerals are viewable by everyone" 
          ON minerals FOR SELECT 
          USING (true);
          
        -- Create policy for authenticated users to insert their own minerals
        DROP POLICY IF EXISTS "Users can insert their own minerals" ON minerals;
        CREATE POLICY "Users can insert their own minerals" 
          ON minerals FOR INSERT 
          TO authenticated 
          WITH CHECK ("user" = auth.uid());
          
        -- Create policy for authenticated users to update their own minerals
        DROP POLICY IF EXISTS "Users can update their own minerals" ON minerals;
        CREATE POLICY "Users can update their own minerals" 
          ON minerals FOR UPDATE 
          TO authenticated 
          USING ("user" = auth.uid());
          
        -- Create policy for authenticated users to delete their own minerals
        DROP POLICY IF EXISTS "Users can delete their own minerals" ON minerals;
        CREATE POLICY "Users can delete their own minerals" 
          ON minerals FOR DELETE 
          TO authenticated 
          USING ("user" = auth.uid());
      `
    });
    
    if (rlsError) {
      throw new Error(`Failed to set up RLS policies: ${rlsError.message}`);
    }
    
    console.log('✅ Successfully set up Row Level Security policies');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
migrateAddUserColumn()
  .then(() => {
    console.log('✅ Migration completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }); 