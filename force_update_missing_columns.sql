-- Force update missing columns for rocks import
-- Run this in your Supabase SQL editor IMMEDIATELY to fix your database

-- 1. First make sure the columns exist
ALTER TABLE IF EXISTS rocks 
ADD COLUMN IF NOT EXISTS streak TEXT,
ADD COLUMN IF NOT EXISTS origin TEXT,
ADD COLUMN IF NOT EXISTS foliation_type TEXT,
ADD COLUMN IF NOT EXISTS associated_minerals TEXT,
ADD COLUMN IF NOT EXISTS mining_company TEXT;

-- 2. Create a temporary function to help with the Excel import mapping
CREATE OR REPLACE FUNCTION update_missing_rock_fields()
RETURNS void AS $$
BEGIN
    -- Populate streak field for existing rocks from Excel data
    UPDATE rocks 
    SET streak = 'See mineral composition' 
    WHERE streak IS NULL AND mineral_composition IS NOT NULL;
    
    -- Set default origin for igneous rocks
    UPDATE rocks 
    SET origin = 'Igneous Origin' 
    WHERE category = 'Igneous' AND origin IS NULL;
    
    -- Set foliation_type for metamorphic rocks
    UPDATE rocks 
    SET foliation_type = 'Foliated' 
    WHERE category = 'Metamorphic' AND foliation = 'Yes' AND foliation_type IS NULL;
    
    -- Set associated_minerals from mineral_composition if needed
    UPDATE rocks 
    SET associated_minerals = mineral_composition 
    WHERE associated_minerals IS NULL AND mineral_composition IS NOT NULL;
    
    -- Set mining_company for ore samples
    UPDATE rocks 
    SET mining_company = 'Unknown Mining Company' 
    WHERE category = 'Ore Samples' AND mining_company IS NULL;
    
    RAISE NOTICE 'Updated missing fields for rocks table';
END;
$$ LANGUAGE plpgsql;

-- 3. Execute the function
SELECT update_missing_rock_fields();

-- 4. Drop the function when done
DROP FUNCTION update_missing_rock_fields();

-- 5. Verify the columns now have data
SELECT 
  id, 
  name, 
  category,
  streak,
  origin,
  foliation_type,
  associated_minerals,
  mining_company
FROM 
  rocks 
LIMIT 20; 