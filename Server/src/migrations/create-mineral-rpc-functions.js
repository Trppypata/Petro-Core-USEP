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
 * Migration: Create RPC functions for mineral operations
 * 
 * This migration adds RPC functions to safely handle minerals operations
 * with proper user context
 */
async function createMineralRpcFunctions() {
  try {
    console.log('🔄 Creating RPC functions for minerals operations');
    
    // Create insert_mineral function
    const { error: insertError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION insert_mineral(mineral_data JSONB)
        RETURNS JSONB
        LANGUAGE plpgsql
        SECURITY DEFINER -- Run with privileges of the function creator
        SET search_path = public -- Prevent search_path injection
        AS $$
        DECLARE
          result JSONB;
          new_id UUID;
        BEGIN
          -- Set the user ID to the authenticated user
          mineral_data := mineral_data || jsonb_build_object('user', auth.uid());
          
          -- Insert the mineral and return the inserted record
          INSERT INTO minerals 
          SELECT * FROM jsonb_populate_record(null::minerals, mineral_data)
          RETURNING id INTO new_id;
          
          -- Get the inserted record
          SELECT row_to_json(m)::JSONB INTO result
          FROM minerals m
          WHERE id = new_id;
          
          RETURN result;
        EXCEPTION
          WHEN OTHERS THEN
            RAISE EXCEPTION 'Error inserting mineral: %', SQLERRM;
        END;
        $$;
      `
    });
    
    if (insertError) {
      throw new Error(`Failed to create insert_mineral function: ${insertError.message}`);
    }
    
    console.log('✅ Successfully created insert_mineral function');
    
    // Create update_mineral function
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION update_mineral(mineral_id UUID, mineral_data JSONB)
        RETURNS JSONB
        LANGUAGE plpgsql
        SECURITY DEFINER -- Run with privileges of the function creator
        SET search_path = public -- Prevent search_path injection
        AS $$
        DECLARE
          result JSONB;
          has_access BOOLEAN;
        BEGIN
          -- Check if the user has access to this mineral
          SELECT EXISTS (
            SELECT 1 FROM minerals 
            WHERE id = mineral_id AND "user" = auth.uid()
          ) INTO has_access;
          
          -- If not admin and doesn't own this mineral, raise error
          IF NOT has_access THEN
            RAISE EXCEPTION 'Access denied to mineral %', mineral_id;
          END IF;
          
          -- Update the mineral (preserving the user field)
          UPDATE minerals
          SET (
            mineral_code, mineral_name, chemical_formula, mineral_group, 
            color, streak, luster, hardness, cleavage, fracture, 
            habit, crystal_system, category, type, image_url, 
            specific_gravity, transparency, occurrence, uses
          ) = (
            SELECT 
              m.mineral_code, m.mineral_name, m.chemical_formula, m.mineral_group, 
              m.color, m.streak, m.luster, m.hardness, m.cleavage, m.fracture, 
              m.habit, m.crystal_system, m.category, m.type, m.image_url, 
              m.specific_gravity, m.transparency, m.occurrence, m.uses
            FROM jsonb_populate_record(null::minerals, mineral_data) as m
          )
          WHERE id = mineral_id
          RETURNING row_to_json(minerals)::JSONB INTO result;
          
          RETURN result;
        EXCEPTION
          WHEN OTHERS THEN
            RAISE EXCEPTION 'Error updating mineral %: %', mineral_id, SQLERRM;
        END;
        $$;
      `
    });
    
    if (updateError) {
      throw new Error(`Failed to create update_mineral function: ${updateError.message}`);
    }
    
    console.log('✅ Successfully created update_mineral function');
    
    // Create delete_mineral function
    const { error: deleteError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION delete_mineral(mineral_id UUID)
        RETURNS BOOLEAN
        LANGUAGE plpgsql
        SECURITY DEFINER -- Run with privileges of the function creator
        SET search_path = public -- Prevent search_path injection
        AS $$
        DECLARE
          has_access BOOLEAN;
        BEGIN
          -- Check if the user has access to this mineral
          SELECT EXISTS (
            SELECT 1 FROM minerals 
            WHERE id = mineral_id AND "user" = auth.uid()
          ) INTO has_access;
          
          -- If not admin and doesn't own this mineral, raise error
          IF NOT has_access THEN
            RAISE EXCEPTION 'Access denied to mineral %', mineral_id;
          END IF;
          
          -- Delete the mineral
          DELETE FROM minerals WHERE id = mineral_id;
          
          RETURN true;
        EXCEPTION
          WHEN OTHERS THEN
            RAISE EXCEPTION 'Error deleting mineral %: %', mineral_id, SQLERRM;
            RETURN false;
        END;
        $$;
      `
    });
    
    if (deleteError) {
      throw new Error(`Failed to create delete_mineral function: ${deleteError.message}`);
    }
    
    console.log('✅ Successfully created delete_mineral function');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
createMineralRpcFunctions()
  .then(() => {
    console.log('✅ Migration completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }); 