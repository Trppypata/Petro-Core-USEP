const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables:');
  console.error('SUPABASE_URL:', supabaseUrl ? 'Present' : 'Missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Present' : 'Missing');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Get the script name from command line arguments
let scriptName = 'migrate_add_coordinates.sql'; // Default script
const scriptArg = process.argv.find(arg => arg.startsWith('--script='));
if (scriptArg) {
  scriptName = scriptArg.split('=')[1];
}

async function runMigration() {
  try {
    console.log(`Starting migration with script: ${scriptName}...`);
    
    // Read migration SQL
    const migrationSql = fs.readFileSync(
      path.resolve(__dirname, scriptName),
      'utf8'
    );
    
    console.log('Migration SQL loaded. Running...');
    
    // Execute the migration
    const { error } = await supabase.rpc('pgmig', { query: migrationSql });
    
    if (error) {
      if (error.message.includes("function \"pgmig\" does not exist")) {
        console.log('pgmig function not available. Trying alternative approach...');
        // Alternative approach: using raw SQL query
        // Note: This requires that your service role has direct SQL execution permissions
        const { error: sqlError } = await supabase.rpc('exec_sql', { sql: migrationSql });
        
        if (sqlError) {
          console.error('Alternative migration failed:', sqlError);
          
          console.log('\nMigration could not be executed automatically. Please:');
          console.log('1. Go to your Supabase dashboard (https://app.supabase.io)');
          console.log('2. Navigate to the SQL Editor');
          console.log('3. Paste the following SQL and execute it:');
          console.log('-------------------------------------------');
          console.log(migrationSql);
          console.log('-------------------------------------------');
          process.exit(1);
        } else {
          console.log('Migration successful using alternative approach!');
        }
      } else {
        console.error('Migration failed:', error);
        process.exit(1);
      }
    } else {
      console.log('Migration successful!');
    }
    
    // Verify migration
    console.log('Verifying migration...');
    const { data, error: verifyError } = await supabase
      .from('rocks')
      .select('id, rock_code, category')
      .limit(5);
      
    if (verifyError) {
      console.error('Verification failed:', verifyError);
    } else {
      console.log('Sample data after migration:');
      console.table(data);
    }
    
  } catch (err) {
    console.error('Unexpected error during migration:', err);
    process.exit(1);
  }
}

runMigration(); 