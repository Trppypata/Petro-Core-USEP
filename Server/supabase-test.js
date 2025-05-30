const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
const envPath = path.resolve(__dirname, '.env');
console.log('Loading environment from:', envPath);
dotenv.config({ path: envPath });

// Check if environment variables are loaded
console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
console.log('SUPABASE_URL starts with https:', process.env.SUPABASE_URL?.startsWith('https://'));
console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('SUPABASE_SERVICE_ROLE_KEY length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0);

// Attempt to connect to Supabase
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('Creating Supabase client...');
  
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  // Try to access the rocks table
  async function testConnection() {
    try {
      console.log('Trying to access rocks table...');
      
      // Just get a count with correct syntax
      const { count, error } = await supabase
        .from('rocks')
        .select('*', { count: 'exact', head: true });
        
      if (error) {
        console.error('Error accessing rocks table:', error);
      } else {
        console.log('Success! Connected to Supabase rocks table. Count:', count);
        
        // Try to get a single rock to test data access
        const { data: rockData, error: rockError } = await supabase
          .from('rocks')
          .select('*')
          .limit(1);
          
        if (rockError) {
          console.error('Error getting a rock:', rockError);
        } else if (rockData && rockData.length > 0) {
          console.log('Successfully retrieved a rock:', {
            id: rockData[0].id,
            name: rockData[0].name,
            rock_code: rockData[0].rock_code,
            category: rockData[0].category
          });
        } else {
          console.log('No rocks found in the table');
        }
      }
    } catch (err) {
      console.error('Exception during Supabase test:', err);
    }
  }
  
  testConnection();
} else {
  console.error('Missing Supabase environment variables, cannot connect');
} 