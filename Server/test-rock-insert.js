const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
const envPath = path.resolve(__dirname, '.env');
console.log('Loading environment from:', envPath);
dotenv.config({ path: envPath });

// Check if environment variables are loaded
console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

// Attempt to connect to Supabase
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('Creating Supabase client...');
  
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  // Sample rock data
  const testRock = {
    rock_code: 'TEST-001',
    name: 'Test Rock',
    category: 'Igneous',
    type: 'Test Type',
    color: 'Gray',
    status: 'active',
    description: 'A test rock created via script'
  };
  
  // Try to insert a rock
  async function insertTestRock() {
    try {
      console.log('Trying to insert a test rock...');
      
      const { data, error } = await supabase
        .from('rocks')
        .upsert(testRock, { 
          onConflict: 'rock_code',
          ignoreDuplicates: false
        })
        .select();
        
      if (error) {
        console.error('Error inserting test rock:', error);
        
        // Log more details about the error
        if (error.code === '42P01') {
          console.error('Table "rocks" does not exist. You need to create the table first.');
        } else if (error.code === '23505') {
          console.error('Duplicate key value violates unique constraint.');
        } else if (error.code === '23503') {
          console.error('Foreign key constraint violation.');
        } else if (error.code === 'PGRST301') {
          console.error('Row-level security (RLS) policy violation.');
          console.log('Check your RLS policies on the rocks table in Supabase dashboard.');
        }
      } else {
        console.log('Success! Inserted test rock:', data);
      }
    } catch (err) {
      console.error('Exception during Supabase insert:', err);
    }
  }
  
  insertTestRock();
} else {
  console.error('Missing Supabase environment variables, cannot connect');
} 