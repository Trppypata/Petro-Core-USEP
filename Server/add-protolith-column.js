// Simple script to add the protolith column to the rocks table
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.error('Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env file');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  }
});

const addProtolithColumn = async () => {
  try {
    console.log('Starting process to add protolith column to rocks table');
    
    // Use stored function to execute SQL directly
    const query = "ALTER TABLE rocks ADD COLUMN IF NOT EXISTS protolith TEXT";
    
    console.log('Executing SQL:', query);
    
    const { data, error } = await supabase.rpc('pg_query', { query_text: query });
    
    if (error) {
      console.error('Error adding protolith column:', error);
      return;
    }
    
    console.log('Successfully added protolith column to rocks table');
    console.log('Response:', data);
  } catch (error) {
    console.error('Process failed:', error);
  }
};

// Execute the function
addProtolithColumn()
  .then(() => console.log('Process completed'))
  .catch((error) => console.error('Process failed:', error)); 