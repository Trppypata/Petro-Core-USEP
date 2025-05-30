-- Function to import rocks in bulk
CREATE OR REPLACE FUNCTION import_rocks(rocks_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- This makes the function run with the privileges of the creator
AS $$
DECLARE
  rock_record JSONB;
  inserted_count INTEGER := 0;
  updated_count INTEGER := 0;
  error_count INTEGER := 0;
  rock_id UUID;
  insert_error TEXT;
  error_details JSONB := '[]'::JSONB;
BEGIN
  -- Loop through each rock in the array
  FOR rock_record IN SELECT * FROM jsonb_array_elements(rocks_data)
  LOOP
    BEGIN
      -- Insert or update the rock
      -- Only using columns that exist in the database
      INSERT INTO rocks (
        rock_code,
        name,
        chemical_formula,
        hardness,
        category,
        type,
        depositional_environment,
        grain_size,
        color,
        texture,
        latitude,
        longitude,
        locality,
        mineral_composition,
        description,
        formation,
        geological_age,
        status,
        image_url,
        associated_minerals,
        metamorphism_type,
        metamorphic_grade,
        parent_rock,
        foliation,
        silica_content,
        cooling_rate,
        mineral_content,
        bedding,
        sorting,
        roundness,
        fossil_content,
        sediment_source,
        commodity_type,
        ore_group,
        mining_company,
        coordinates,
        luster,
        reaction_to_hcl,
        magnetism
      )
      VALUES (
        (rock_record->>'rock_code')::TEXT,
        (rock_record->>'name')::TEXT,
        (rock_record->>'chemical_formula')::TEXT,
        (rock_record->>'hardness')::TEXT,
        (rock_record->>'category')::TEXT,
        (rock_record->>'type')::TEXT,
        (rock_record->>'depositional_environment')::TEXT,
        (rock_record->>'grain_size')::TEXT,
        (rock_record->>'color')::TEXT,
        (rock_record->>'texture')::TEXT,
        (rock_record->>'latitude')::TEXT,
        (rock_record->>'longitude')::TEXT,
        (rock_record->>'locality')::TEXT,
        (rock_record->>'mineral_composition')::TEXT,
        (rock_record->>'description')::TEXT,
        (rock_record->>'formation')::TEXT,
        (rock_record->>'geological_age')::TEXT,
        (rock_record->>'status')::TEXT,
        (rock_record->>'image_url')::TEXT,
        (rock_record->>'associated_minerals')::TEXT,
        (rock_record->>'metamorphism_type')::TEXT,
        (rock_record->>'metamorphic_grade')::TEXT,
        (rock_record->>'parent_rock')::TEXT,
        (rock_record->>'foliation')::TEXT,
        (rock_record->>'silica_content')::TEXT,
        (rock_record->>'cooling_rate')::TEXT,
        (rock_record->>'mineral_content')::TEXT,
        (rock_record->>'bedding')::TEXT,
        (rock_record->>'sorting')::TEXT,
        (rock_record->>'roundness')::TEXT,
        (rock_record->>'fossil_content')::TEXT,
        (rock_record->>'sediment_source')::TEXT,
        (rock_record->>'commodity_type')::TEXT,
        (rock_record->>'ore_group')::TEXT,
        (rock_record->>'mining_company')::TEXT,
        (rock_record->>'coordinates')::TEXT,
        (rock_record->>'luster')::TEXT,
        (rock_record->>'reaction_to_hcl')::TEXT,
        (rock_record->>'magnetism')::TEXT
      )
      ON CONFLICT (rock_code) 
      DO UPDATE SET 
        name = EXCLUDED.name,
        chemical_formula = EXCLUDED.chemical_formula,
        hardness = EXCLUDED.hardness,
        category = EXCLUDED.category,
        type = EXCLUDED.type,
        depositional_environment = EXCLUDED.depositional_environment,
        grain_size = EXCLUDED.grain_size,
        color = EXCLUDED.color,
        texture = EXCLUDED.texture,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        locality = EXCLUDED.locality,
        mineral_composition = EXCLUDED.mineral_composition,
        description = EXCLUDED.description,
        formation = EXCLUDED.formation,
        geological_age = EXCLUDED.geological_age,
        status = EXCLUDED.status,
        image_url = EXCLUDED.image_url,
        associated_minerals = EXCLUDED.associated_minerals,
        metamorphism_type = EXCLUDED.metamorphism_type,
        metamorphic_grade = EXCLUDED.metamorphic_grade,
        parent_rock = EXCLUDED.parent_rock,
        foliation = EXCLUDED.foliation,
        silica_content = EXCLUDED.silica_content,
        cooling_rate = EXCLUDED.cooling_rate,
        mineral_content = EXCLUDED.mineral_content,
        bedding = EXCLUDED.bedding,
        sorting = EXCLUDED.sorting,
        roundness = EXCLUDED.roundness,
        fossil_content = EXCLUDED.fossil_content,
        sediment_source = EXCLUDED.sediment_source,
        commodity_type = EXCLUDED.commodity_type,
        ore_group = EXCLUDED.ore_group,
        mining_company = EXCLUDED.mining_company,
        coordinates = EXCLUDED.coordinates,
        luster = EXCLUDED.luster,
        reaction_to_hcl = EXCLUDED.reaction_to_hcl,
        magnetism = EXCLUDED.magnetism,
        updated_at = NOW()
      RETURNING id INTO rock_id;
      
      -- Check if this was an insert or update
      IF rock_id IS NOT NULL THEN
        -- This was an insert
        inserted_count := inserted_count + 1;
      ELSE
        -- This was an update (should not happen with current logic but keeping for safety)
        updated_count := updated_count + 1;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log the error and continue with the next record
      error_count := error_count + 1;
      insert_error := SQLERRM;
      
      -- Add error details to the error_details array
      error_details := error_details || jsonb_build_object(
        'rock_code', rock_record->>'rock_code',
        'name', rock_record->>'name',
        'error', insert_error
      );
      
      RAISE NOTICE 'Error importing rock with code %: %', (rock_record->>'rock_code'), insert_error;
    END;
  END LOOP;
  
  -- Return a JSON object with the results
  RETURN jsonb_build_object(
    'success', TRUE,
    'inserted', inserted_count,
    'updated', updated_count,
    'errors', error_count,
    'error_details', error_details,
    'message', 'Successfully processed ' || (inserted_count + updated_count) || ' rocks with ' || error_count || ' errors'
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION import_rocks(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION import_rocks(JSONB) TO service_role; 