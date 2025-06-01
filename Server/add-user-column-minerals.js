require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Supabase client setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to check if column exists
async function checkColumnExists(table, column) {
  const { data, error } = await supabase
    .from(table)
    .select(column)
    .limit(1)
    .catch(() => ({ data: null, error: { message: `Column ${column} does not exist` } }));

  return !error;
}

// Main function to add user column if it doesn't exist
async function addUserColumnToMinerals() {
  console.log('Checking if user column exists in minerals table...');
  
  const userColumnExists = await checkColumnExists('minerals', 'user');
  
  if (userColumnExists) {
    console.log('User column already exists in minerals table.');
    return;
  }
  
  console.log('User column does not exist. Adding user column to minerals table...');
  
  try {
    // Execute SQL to add user column
    // We're using a PostgreSQL UUID type to match the Supabase auth.users table id format
    const { data, error } = await supabase
      .rpc('execute_sql', {
        sql: `ALTER TABLE minerals ADD COLUMN IF NOT EXISTS "user" UUID REFERENCES auth.users(id) NULL;`
      });
    
    if (error) {
      console.error('Error adding user column:', error);
      throw error;
    }
    
    console.log('Successfully added user column to minerals table!');
    
    // Create an RPC function for inserting minerals with user data
    console.log('Creating RPC function for inserting minerals...');
    await supabase.rpc('execute_sql', {
      sql: `
      CREATE OR REPLACE FUNCTION insert_mineral(mineral_data JSONB)
      RETURNS JSONB
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        result JSONB;
      BEGIN
        INSERT INTO minerals 
        SELECT * FROM jsonb_populate_record(null::minerals, mineral_data)
        RETURNING to_jsonb(*) INTO result;
        
        RETURN result;
      END;
      $$;`
    });
    
    // Create an RPC function for updating minerals with user data
    console.log('Creating RPC function for updating minerals...');
    await supabase.rpc('execute_sql', {
      sql: `
      CREATE OR REPLACE FUNCTION update_mineral(mineral_id UUID, mineral_data JSONB)
      RETURNS JSONB
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        result JSONB;
      BEGIN
        UPDATE minerals 
        SET (id, mineral_code, mineral_name, chemical_formula, mineral_group, color, streak, luster, hardness, cleavage, fracture, habit, crystal_system, category, type, specific_gravity, transparency, occurrence, uses, image_url, "user") = 
        (
          COALESCE(mineral_data->>'id', id),
          COALESCE(mineral_data->>'mineral_code', mineral_code),
          COALESCE(mineral_data->>'mineral_name', mineral_name),
          COALESCE(mineral_data->>'chemical_formula', chemical_formula),
          COALESCE(mineral_data->>'mineral_group', mineral_group),
          COALESCE(mineral_data->>'color', color),
          COALESCE(mineral_data->>'streak', streak),
          COALESCE(mineral_data->>'luster', luster),
          COALESCE(mineral_data->>'hardness', hardness),
          COALESCE(mineral_data->>'cleavage', cleavage),
          COALESCE(mineral_data->>'fracture', fracture),
          COALESCE(mineral_data->>'habit', habit),
          COALESCE(mineral_data->>'crystal_system', crystal_system),
          COALESCE(mineral_data->>'category', category),
          COALESCE(mineral_data->>'type', type),
          COALESCE(mineral_data->>'specific_gravity', specific_gravity),
          COALESCE(mineral_data->>'transparency', transparency),
          COALESCE(mineral_data->>'occurrence', occurrence),
          COALESCE(mineral_data->>'uses', uses),
          COALESCE(mineral_data->>'image_url', image_url),
          COALESCE((mineral_data->>'user')::uuid, "user")
        )
        WHERE id = mineral_id
        RETURNING to_jsonb(*) INTO result;
        
        RETURN result;
      END;
      $$;`
    });
    
    console.log('Successfully created RPC functions!');
    
  } catch (err) {
    console.error('Failed to add user column or create RPC functions:', err);
    process.exit(1);
  }
}

// Run the function
addUserColumnToMinerals()
  .then(() => {
    console.log('Migration completed successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  }); 