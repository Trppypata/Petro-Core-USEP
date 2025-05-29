-- Function to import minerals with admin privileges
-- This bypasses row-level security policies
CREATE OR REPLACE FUNCTION import_minerals(minerals_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- This makes the function run with the privileges of the user who created it
AS $$
DECLARE
    result JSONB;
    inserted_count INTEGER := 0;
    mineral_record JSONB;
BEGIN
    -- Loop through each mineral record in the input array
    FOR mineral_record IN SELECT * FROM jsonb_array_elements(minerals_data)
    LOOP
        -- Insert or update each mineral
        INSERT INTO minerals (
            mineral_code, 
            mineral_name, 
            chemical_formula, 
            mineral_group, 
            color, 
            streak, 
            luster, 
            hardness, 
            cleavage, 
            fracture, 
            habit, 
            crystal_system, 
            category, 
            type,
            specific_gravity,
            transparency,
            occurrence,
            uses,
            image_url
        )
        VALUES (
            (mineral_record->>'mineral_code')::TEXT,
            (mineral_record->>'mineral_name')::TEXT,
            (mineral_record->>'chemical_formula')::TEXT,
            (mineral_record->>'mineral_group')::TEXT,
            (mineral_record->>'color')::TEXT,
            (mineral_record->>'streak')::TEXT,
            (mineral_record->>'luster')::TEXT,
            (mineral_record->>'hardness')::TEXT,
            (mineral_record->>'cleavage')::TEXT,
            (mineral_record->>'fracture')::TEXT,
            (mineral_record->>'habit')::TEXT,
            (mineral_record->>'crystal_system')::TEXT,
            (mineral_record->>'category')::TEXT,
            (mineral_record->>'type')::TEXT,
            (mineral_record->>'specific_gravity')::TEXT,
            (mineral_record->>'transparency')::TEXT,
            (mineral_record->>'occurrence')::TEXT,
            (mineral_record->>'uses')::TEXT,
            (mineral_record->>'image_url')::TEXT
        )
        ON CONFLICT (mineral_code) 
        DO UPDATE SET
            mineral_name = EXCLUDED.mineral_name,
            chemical_formula = EXCLUDED.chemical_formula,
            mineral_group = EXCLUDED.mineral_group,
            color = EXCLUDED.color,
            streak = EXCLUDED.streak,
            luster = EXCLUDED.luster,
            hardness = EXCLUDED.hardness,
            cleavage = EXCLUDED.cleavage,
            fracture = EXCLUDED.fracture,
            habit = EXCLUDED.habit,
            crystal_system = EXCLUDED.crystal_system,
            category = EXCLUDED.category,
            type = EXCLUDED.type,
            specific_gravity = EXCLUDED.specific_gravity,
            transparency = EXCLUDED.transparency,
            occurrence = EXCLUDED.occurrence,
            uses = EXCLUDED.uses,
            image_url = EXCLUDED.image_url;
            
        inserted_count := inserted_count + 1;
    END LOOP;
    
    result := jsonb_build_object(
        'success', true,
        'message', 'Successfully imported ' || inserted_count || ' minerals',
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
GRANT EXECUTE ON FUNCTION import_minerals(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION import_minerals(JSONB) TO anon;
GRANT EXECUTE ON FUNCTION import_minerals(JSONB) TO service_role; 