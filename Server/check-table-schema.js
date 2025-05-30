require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkTableSchema() {
  // Create Supabase client
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  
  console.log('Checking schema for rocks table...');
  
  try {
    // Query to get a single rock to see what columns are returned
    const { data, error } = await supabase
      .from('rocks')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('Error fetching table schema:', error);
      return;
    }
    
    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log('Found columns in rocks table:');
      columns.forEach((col, index) => {
        console.log(`${index + 1}. ${col}`);
      });
      
      // Check for specific fields that caused errors
      const hasStreak = columns.includes('streak');
      const hasOrigin = columns.includes('origin');
      const hasProtolith = columns.includes('protolith');
      
      console.log('\nChecking specific problematic fields:');
      console.log('streak exists:', hasStreak);
      console.log('origin exists:', hasOrigin);
      console.log('protolith exists:', hasProtolith);
    } else {
      console.log('No rocks found in the table. Creating a test rock to see the schema...');
      
      // Create a test rock to see what columns are accepted
      const testRock = {
        rock_code: 'TEST-SCHEMA-001',
        name: 'Schema Test Rock',
        category: 'Test',
        type: 'Test'
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('rocks')
        .insert(testRock)
        .select();
        
      if (insertError) {
        console.error('Error inserting test rock:', insertError);
      } else if (insertData && insertData.length > 0) {
        const columns = Object.keys(insertData[0]);
        console.log('Columns in rocks table from test insert:');
        columns.forEach((col, index) => {
          console.log(`${index + 1}. ${col}`);
        });
      }
    }
  } catch (error) {
    console.error('Unexpected error checking schema:', error);
  }
}

checkTableSchema(); 