-- Update the import_rocks function to properly handle all fields
-- Run this in your Supabase SQL editor

-- Drop the existing function first
DROP FUNCTION IF EXISTS import_rocks;

-- Create an updated version that handles all fields correctly
CREATE OR REPLACE FUNCTION import_rocks(rocks_data JSONB)
RETURNS JSONB AS $$
DECLARE
  inserted_count INTEGER := 0;
  updated_count INTEGER := 0;
  error_count INTEGER := 0;
  error_details TEXT := '';
  rock JSONB;
  rock_record RECORD;
BEGIN
  -- Loop through each rock in the provided JSON array
  FOR rock IN SELECT * FROM jsonb_array_elements(rocks_data)
  LOOP
    BEGIN
      -- Check if rock already exists by rock_code
      SELECT * INTO rock_record FROM rocks WHERE rock_code = rock->>'rock_code';
      
      IF rock_record.id IS NULL THEN
        -- Insert new rock with ALL fields
        INSERT INTO rocks (
          rock_code, name, chemical_formula, hardness, category, type, 
          depositional_environment, grain_size, color, texture, 
          latitude, longitude, locality, mineral_composition, 
          description, formation, geological_age, status, image_url,
          associated_minerals, metamorphism_type, metamorphic_grade, 
          parent_rock, foliation, foliation_type, protolith,
          silica_content, cooling_rate, mineral_content, origin,
          bedding, sorting, roundness, fossil_content, sediment_source,
          commodity_type, ore_group, mining_company, coordinates,
          luster, reaction_to_hcl, magnetism, streak
        ) VALUES (
          rock->>'rock_code', rock->>'name', rock->>'chemical_formula', 
          rock->>'hardness', rock->>'category', rock->>'type',
          rock->>'depositional_environment', rock->>'grain_size', 
          rock->>'color', rock->>'texture', rock->>'latitude', 
          rock->>'longitude', rock->>'locality', rock->>'mineral_composition',
          rock->>'description', rock->>'formation', rock->>'geological_age', 
          COALESCE(rock->>'status', 'active'), rock->>'image_url',
          rock->>'associated_minerals', rock->>'metamorphism_type', 
          rock->>'metamorphic_grade', rock->>'parent_rock', 
          rock->>'foliation', rock->>'foliation_type', rock->>'protolith',
          rock->>'silica_content', rock->>'cooling_rate', 
          rock->>'mineral_content', rock->>'origin',
          rock->>'bedding', rock->>'sorting', rock->>'roundness', 
          rock->>'fossil_content', rock->>'sediment_source',
          rock->>'commodity_type', rock->>'ore_group', 
          rock->>'mining_company', rock->>'coordinates',
          rock->>'luster', rock->>'reaction_to_hcl', 
          rock->>'magnetism', rock->>'streak'
        );
        
        inserted_count := inserted_count + 1;
      ELSE
        -- Update existing rock with ALL fields
        UPDATE rocks SET
          name = COALESCE(rock->>'name', name),
          chemical_formula = COALESCE(rock->>'chemical_formula', chemical_formula),
          hardness = COALESCE(rock->>'hardness', hardness),
          category = COALESCE(rock->>'category', category),
          type = COALESCE(rock->>'type', type),
          depositional_environment = COALESCE(rock->>'depositional_environment', depositional_environment),
          grain_size = COALESCE(rock->>'grain_size', grain_size),
          color = COALESCE(rock->>'color', color),
          texture = COALESCE(rock->>'texture', texture),
          latitude = COALESCE(rock->>'latitude', latitude),
          longitude = COALESCE(rock->>'longitude', longitude),
          locality = COALESCE(rock->>'locality', locality),
          mineral_composition = COALESCE(rock->>'mineral_composition', mineral_composition),
          description = COALESCE(rock->>'description', description),
          formation = COALESCE(rock->>'formation', formation),
          geological_age = COALESCE(rock->>'geological_age', geological_age),
          status = COALESCE(rock->>'status', status),
          image_url = COALESCE(rock->>'image_url', image_url),
          associated_minerals = COALESCE(rock->>'associated_minerals', associated_minerals),
          metamorphism_type = COALESCE(rock->>'metamorphism_type', metamorphism_type),
          metamorphic_grade = COALESCE(rock->>'metamorphic_grade', metamorphic_grade),
          parent_rock = COALESCE(rock->>'parent_rock', parent_rock),
          foliation = COALESCE(rock->>'foliation', foliation),
          foliation_type = COALESCE(rock->>'foliation_type', foliation_type),
          protolith = COALESCE(rock->>'protolith', protolith),
          silica_content = COALESCE(rock->>'silica_content', silica_content),
          cooling_rate = COALESCE(rock->>'cooling_rate', cooling_rate),
          mineral_content = COALESCE(rock->>'mineral_content', mineral_content),
          origin = COALESCE(rock->>'origin', origin),
          bedding = COALESCE(rock->>'bedding', bedding),
          sorting = COALESCE(rock->>'sorting', sorting),
          roundness = COALESCE(rock->>'roundness', roundness),
          fossil_content = COALESCE(rock->>'fossil_content', fossil_content),
          sediment_source = COALESCE(rock->>'sediment_source', sediment_source),
          commodity_type = COALESCE(rock->>'commodity_type', commodity_type),
          ore_group = COALESCE(rock->>'ore_group', ore_group),
          mining_company = COALESCE(rock->>'mining_company', mining_company),
          coordinates = COALESCE(rock->>'coordinates', coordinates),
          luster = COALESCE(rock->>'luster', luster),
          reaction_to_hcl = COALESCE(rock->>'reaction_to_hcl', reaction_to_hcl),
          magnetism = COALESCE(rock->>'magnetism', magnetism),
          streak = COALESCE(rock->>'streak', streak)
        WHERE rock_code = rock->>'rock_code';
        
        updated_count := updated_count + 1;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      error_details := error_details || E'\n' || SQLERRM;
    END;
  END LOOP;
  
  -- Return a JSON object with results
  RETURN jsonb_build_object(
    'success', TRUE,
    'inserted', inserted_count,
    'updated', updated_count,
    'errors', error_count,
    'error_details', error_details
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 