const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service role key

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing required environment variables:");
  console.error("- SUPABASE_URL:", supabaseUrl ? "✅ Set" : "❌ Missing");
  console.error(
    "- SUPABASE_SERVICE_ROLE_KEY:",
    supabaseKey ? "✅ Set" : "❌ Missing"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Migration: Add user column to the rocks table
 *
 * This migration adds a 'user' column to the rocks table
 * to support Row Level Security policies
 */
async function migrateAddUserColumn() {
  try {
    console.log("🔄 Starting migration: Add user column to rocks table");

    // Check if the column already exists
    const { data: columnData, error: columnError } = await supabase
      .from("rocks")
      .select("user")
      .limit(1);

    if (!columnError) {
      console.log("✅ The user column already exists in the rocks table");
      return;
    }

    console.log("🔧 Adding user column to rocks table...");

    // Add the user column
    const { data, error } = await supabase.rpc("exec_sql", {
      sql: `ALTER TABLE rocks ADD COLUMN IF NOT EXISTS "user" UUID REFERENCES auth.users(id);`,
    });

    if (error) {
      throw new Error(`Failed to add user column: ${error.message}`);
    }

    console.log("✅ Successfully added user column to rocks table");

    // Create or update RLS policies
    console.log("🔧 Creating RLS policies for rocks table...");

    // Drop existing policies if they exist
    await supabase.rpc("exec_sql", {
      sql: `
        DROP POLICY IF EXISTS "Authenticated users can read rocks" ON rocks;
        DROP POLICY IF EXISTS "Anonymous users can read rocks" ON rocks;
        DROP POLICY IF EXISTS "Authenticated users can insert rocks" ON rocks;
        DROP POLICY IF EXISTS "Authenticated users can update rocks" ON rocks;
        DROP POLICY IF EXISTS "Authenticated users can delete rocks" ON rocks;
      `,
    });

    // Create new policies
    const { error: policyError } = await supabase.rpc("exec_sql", {
      sql: `
        -- Enable RLS
        ALTER TABLE rocks ENABLE ROW LEVEL SECURITY;
        
        -- Create policy for authenticated users to read all rocks
        CREATE POLICY "Authenticated users can read rocks"
          ON rocks
          FOR SELECT
          TO authenticated
          USING (true);

        -- Create policy for anonymous users to read all rocks
        CREATE POLICY "Anonymous users can read rocks"
          ON rocks
          FOR SELECT
          TO anon
          USING (true);

        -- Create policy for authenticated users to insert rocks
        CREATE POLICY "Authenticated users can insert rocks"
          ON rocks
          FOR INSERT
          TO authenticated
          WITH CHECK (true);

        -- Create policy for authenticated users to update rocks
        CREATE POLICY "Authenticated users can update rocks"
          ON rocks
          FOR UPDATE
          TO authenticated
          USING (true)
          WITH CHECK (true);

        -- Create policy for authenticated users to delete rocks
        CREATE POLICY "Authenticated users can delete rocks"
          ON rocks
          FOR DELETE
          TO authenticated
          USING (true);
      `,
    });

    if (policyError) {
      console.warn(
        "⚠️ Warning: Could not create all RLS policies:",
        policyError.message
      );
    } else {
      console.log("✅ Successfully created RLS policies for rocks table");
    }

    // Create RPC functions for rock operations
    console.log("🔧 Creating RPC functions for rock operations...");

    const { error: rpcError } = await supabase.rpc("exec_sql", {
      sql: `
        -- Function to insert a rock with user data
        CREATE OR REPLACE FUNCTION insert_rock_with_user(rock_data jsonb)
        RETURNS jsonb
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          result jsonb;
          inserted_rock rocks%ROWTYPE;
        BEGIN
          -- Insert the rock data
          INSERT INTO rocks (
            rock_code, name, chemical_formula, hardness, category, type,
            depositional_environment, grain_size, color, texture, latitude,
            longitude, coordinates, locality, mineral_composition, description,
            formation, geological_age, status, image_url, associated_minerals,
            metamorphism_type, metamorphic_grade, parent_rock, protolith,
            foliation, foliation_type, silica_content, cooling_rate,
            mineral_content, origin, bedding, sorting, roundness,
            fossil_content, sediment_source, commodity_type, ore_group,
            mining_company, luster, streak, reaction_to_hcl, magnetism,
            "user"
          )
          SELECT 
            COALESCE((rock_data->>'rock_code')::text, ''),
            COALESCE((rock_data->>'name')::text, ''),
            COALESCE((rock_data->>'chemical_formula')::text, ''),
            COALESCE((rock_data->>'hardness')::text, ''),
            COALESCE((rock_data->>'category')::text, ''),
            COALESCE((rock_data->>'type')::text, ''),
            COALESCE((rock_data->>'depositional_environment')::text, ''),
            COALESCE((rock_data->>'grain_size')::text, ''),
            COALESCE((rock_data->>'color')::text, ''),
            COALESCE((rock_data->>'texture')::text, ''),
            COALESCE((rock_data->>'latitude')::text, ''),
            COALESCE((rock_data->>'longitude')::text, ''),
            COALESCE((rock_data->>'coordinates')::text, ''),
            COALESCE((rock_data->>'locality')::text, ''),
            COALESCE((rock_data->>'mineral_composition')::text, ''),
            COALESCE((rock_data->>'description')::text, ''),
            COALESCE((rock_data->>'formation')::text, ''),
            COALESCE((rock_data->>'geological_age')::text, ''),
            COALESCE((rock_data->>'status')::text, 'active'),
            COALESCE((rock_data->>'image_url')::text, ''),
            COALESCE((rock_data->>'associated_minerals')::text, ''),
            COALESCE((rock_data->>'metamorphism_type')::text, ''),
            COALESCE((rock_data->>'metamorphic_grade')::text, ''),
            COALESCE((rock_data->>'parent_rock')::text, ''),
            COALESCE((rock_data->>'protolith')::text, ''),
            COALESCE((rock_data->>'foliation')::text, ''),
            COALESCE((rock_data->>'foliation_type')::text, ''),
            COALESCE((rock_data->>'silica_content')::text, ''),
            COALESCE((rock_data->>'cooling_rate')::text, ''),
            COALESCE((rock_data->>'mineral_content')::text, ''),
            COALESCE((rock_data->>'origin')::text, ''),
            COALESCE((rock_data->>'bedding')::text, ''),
            COALESCE((rock_data->>'sorting')::text, ''),
            COALESCE((rock_data->>'roundness')::text, ''),
            COALESCE((rock_data->>'fossil_content')::text, ''),
            COALESCE((rock_data->>'sediment_source')::text, ''),
            COALESCE((rock_data->>'commodity_type')::text, ''),
            COALESCE((rock_data->>'ore_group')::text, ''),
            COALESCE((rock_data->>'mining_company')::text, ''),
            COALESCE((rock_data->>'luster')::text, ''),
            COALESCE((rock_data->>'streak')::text, ''),
            COALESCE((rock_data->>'reaction_to_hcl')::text, ''),
            COALESCE((rock_data->>'magnetism')::text, ''),
            auth.uid()
          RETURNING * INTO inserted_rock;
          
          -- Convert the result to JSON
          result := to_jsonb(inserted_rock);
          
          RETURN result;
        END;
        $$;

        -- Function to import multiple rocks
        CREATE OR REPLACE FUNCTION import_rocks(rocks_data jsonb)
        RETURNS jsonb
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          rock_item jsonb;
          inserted_count integer := 0;
          updated_count integer := 0;
          error_count integer := 0;
          error_details text[] := '{}';
          result jsonb;
        BEGIN
          -- Loop through each rock in the array
          FOR rock_item IN SELECT * FROM jsonb_array_elements(rocks_data)
          LOOP
            BEGIN
              -- Try to insert or update the rock
              INSERT INTO rocks (
                rock_code, name, chemical_formula, hardness, category, type,
                depositional_environment, grain_size, color, texture, latitude,
                longitude, coordinates, locality, mineral_composition, description,
                formation, geological_age, status, image_url, associated_minerals,
                metamorphism_type, metamorphic_grade, parent_rock, protolith,
                foliation, foliation_type, silica_content, cooling_rate,
                mineral_content, origin, bedding, sorting, roundness,
                fossil_content, sediment_source, commodity_type, ore_group,
                mining_company, luster, streak, reaction_to_hcl, magnetism,
                "user"
              )
              VALUES (
                COALESCE((rock_item->>'rock_code')::text, ''),
                COALESCE((rock_item->>'name')::text, ''),
                COALESCE((rock_item->>'chemical_formula')::text, ''),
                COALESCE((rock_item->>'hardness')::text, ''),
                COALESCE((rock_item->>'category')::text, ''),
                COALESCE((rock_item->>'type')::text, ''),
                COALESCE((rock_item->>'depositional_environment')::text, ''),
                COALESCE((rock_item->>'grain_size')::text, ''),
                COALESCE((rock_item->>'color')::text, ''),
                COALESCE((rock_item->>'texture')::text, ''),
                COALESCE((rock_item->>'latitude')::text, ''),
                COALESCE((rock_item->>'longitude')::text, ''),
                COALESCE((rock_item->>'coordinates')::text, ''),
                COALESCE((rock_item->>'locality')::text, ''),
                COALESCE((rock_item->>'mineral_composition')::text, ''),
                COALESCE((rock_item->>'description')::text, ''),
                COALESCE((rock_item->>'formation')::text, ''),
                COALESCE((rock_item->>'geological_age')::text, ''),
                COALESCE((rock_item->>'status')::text, 'active'),
                COALESCE((rock_item->>'image_url')::text, ''),
                COALESCE((rock_item->>'associated_minerals')::text, ''),
                COALESCE((rock_item->>'metamorphism_type')::text, ''),
                COALESCE((rock_item->>'metamorphic_grade')::text, ''),
                COALESCE((rock_item->>'parent_rock')::text, ''),
                COALESCE((rock_item->>'protolith')::text, ''),
                COALESCE((rock_item->>'foliation')::text, ''),
                COALESCE((rock_item->>'foliation_type')::text, ''),
                COALESCE((rock_item->>'silica_content')::text, ''),
                COALESCE((rock_item->>'cooling_rate')::text, ''),
                COALESCE((rock_item->>'mineral_content')::text, ''),
                COALESCE((rock_item->>'origin')::text, ''),
                COALESCE((rock_item->>'bedding')::text, ''),
                COALESCE((rock_item->>'sorting')::text, ''),
                COALESCE((rock_item->>'roundness')::text, ''),
                COALESCE((rock_item->>'fossil_content')::text, ''),
                COALESCE((rock_item->>'sediment_source')::text, ''),
                COALESCE((rock_item->>'commodity_type')::text, ''),
                COALESCE((rock_item->>'ore_group')::text, ''),
                COALESCE((rock_item->>'mining_company')::text, ''),
                COALESCE((rock_item->>'luster')::text, ''),
                COALESCE((rock_item->>'streak')::text, ''),
                COALESCE((rock_item->>'reaction_to_hcl')::text, ''),
                COALESCE((rock_item->>'magnetism')::text, ''),
                auth.uid()
              )
              ON CONFLICT (rock_code) 
              DO UPDATE SET
                name = EXCLUDED.name,
                chemical_formula = EXCLUDED.chemical_formula,
                hardness = EXCLUDED.hardness,
                category = EXCLUDED.category,
                type = EXCLUDED.type,
                updated_at = NOW();
              
              -- Check if it was an insert or update
              IF FOUND THEN
                updated_count := updated_count + 1;
              ELSE
                inserted_count := inserted_count + 1;
              END IF;
              
            EXCEPTION WHEN OTHERS THEN
              error_count := error_count + 1;
              error_details := array_append(error_details, 
                'Rock: ' || COALESCE((rock_item->>'name')::text, 'Unknown') || 
                ' - Error: ' || SQLERRM);
            END;
          END LOOP;
          
          -- Return the results
          result := jsonb_build_object(
            'inserted', inserted_count,
            'updated', updated_count,
            'errors', error_count,
            'error_details', error_details
          );
          
          RETURN result;
        END;
        $$;
      `,
    });

    if (rpcError) {
      console.warn(
        "⚠️ Warning: Could not create all RPC functions:",
        rpcError.message
      );
    } else {
      console.log("✅ Successfully created RPC functions for rock operations");
    }
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
}

// Run the migration
migrateAddUserColumn()
  .then(() => {
    console.log("✅ Migration completed successfully");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  });
