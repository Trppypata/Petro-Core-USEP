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

async function createExecSqlFunction() {
  try {
    console.log('Creating exec_sql function...');
    
    // Use direct SQL execution since we don't have the exec_sql function yet
    const { error } = await supabase.from('_temp_test').select('*').limit(1);
    
    if (error) {
      console.error('Error testing connection:', error.message);
    } else {
      console.log('Connection to Supabase successful.');
    }
    
    // Create the exec_sql function
    const { data, error: sqlError } = await supabase.functions.invoke('run-sql', {
      body: {
        sql: `
          CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
          RETURNS void
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          BEGIN
            EXECUTE sql_query;
          END;
          $$;
          
          -- Grant execute permissions
          GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;
          GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
        `
      }
    });
    
    if (sqlError) {
      throw new Error(`Failed to create exec_sql function: ${sqlError.message}`);
    }
    
    console.log('✅ Successfully created exec_sql function');
    console.log('Response:', data);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('We need to use the Supabase SQL Editor to create this function:');
    console.error(`
1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Run the following SQL:

CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
`);
    process.exit(1);
  }
}

// Run the function
createExecSqlFunction()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 