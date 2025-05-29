-- Function to import rocks with admin privileges
-- This bypasses row-level security policies
CREATE OR REPLACE FUNCTION import_rocks(rocks_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- This makes the function run with the privileges of the user who created it
AS $$
DECLARE
    result JSONB;
    inserted_count INTEGER := 0;
    rock_record JSONB;
BEGIN
    -- Loop through each rock record in the input array
    FOR rock_record IN SELECT * FROM jsonb_array_elements(rocks_data)
    LOOP
        -- Insert or update each rock
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
            -- Metamorphic specific fields
            associated_minerals,
            metamorphism_type,
            metamorphic_grade,
            parent_rock,
            foliation,
            -- Igneous specific fields
            silica_content,
            cooling_rate,
            mineral_content,
            -- Sedimentary specific fields
            bedding,
            sorting,
            roundness,
            fossil_content,
            sediment_source,
            -- Ore samples specific fields
            commodity_type,
            ore_group,
            mining_company
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
            -- Metamorphic specific fields
            (rock_record->>'associated_minerals')::TEXT,
            (rock_record->>'metamorphism_type')::TEXT,
            (rock_record->>'metamorphic_grade')::TEXT,
            (rock_record->>'parent_rock')::TEXT,
            (rock_record->>'foliation')::TEXT,
            -- Igneous specific fields
            (rock_record->>'silica_content')::TEXT,
            (rock_record->>'cooling_rate')::TEXT,
            (rock_record->>'mineral_content')::TEXT,
            -- Sedimentary specific fields
            (rock_record->>'bedding')::TEXT,
            (rock_record->>'sorting')::TEXT,
            (rock_record->>'roundness')::TEXT,
            (rock_record->>'fossil_content')::TEXT,
            (rock_record->>'sediment_source')::TEXT,
            -- Ore samples specific fields
            (rock_record->>'commodity_type')::TEXT,
            (rock_record->>'ore_group')::TEXT,
            (rock_record->>'mining_company')::TEXT
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
            -- Metamorphic specific fields
            associated_minerals = EXCLUDED.associated_minerals,
            metamorphism_type = EXCLUDED.metamorphism_type,
            metamorphic_grade = EXCLUDED.metamorphic_grade,
            parent_rock = EXCLUDED.parent_rock,
            foliation = EXCLUDED.foliation,
            -- Igneous specific fields
            silica_content = EXCLUDED.silica_content,
            cooling_rate = EXCLUDED.cooling_rate,
            mineral_content = EXCLUDED.mineral_content,
            -- Sedimentary specific fields
            bedding = EXCLUDED.bedding,
            sorting = EXCLUDED.sorting,
            roundness = EXCLUDED.roundness,
            fossil_content = EXCLUDED.fossil_content,
            sediment_source = EXCLUDED.sediment_source,
            -- Ore samples specific fields
            commodity_type = EXCLUDED.commodity_type,
            ore_group = EXCLUDED.ore_group,
            mining_company = EXCLUDED.mining_company;
            
        inserted_count := inserted_count + 1;
    END LOOP;
    
    result := jsonb_build_object(
        'success', true,
        'message', 'Successfully imported ' || inserted_count || ' rocks',
        'count', inserted_count
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Error: ' || SQLERRM,
            'error', SQLERRM
        );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION import_rocks(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION import_rocks(JSONB) TO anon;
GRANT EXECUTE ON FUNCTION import_rocks(JSONB) TO service_role; 