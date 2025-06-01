-- Fix remaining empty fields in rocks table
-- Run this in your Supabase SQL editor immediately

-- 1. Fix foliation field for all rocks (especially metamorphic rocks)
UPDATE rocks 
SET foliation = 'Present' 
WHERE category = 'Metamorphic' AND (foliation IS NULL OR foliation = '');

-- 2. Fix protolith field for metamorphic rocks
UPDATE rocks 
SET protolith = 
  CASE 
    WHEN parent_rock IS NOT NULL AND parent_rock != '' THEN parent_rock
    ELSE 'Unknown parent rock'
  END
WHERE category = 'Metamorphic' AND (protolith IS NULL OR protolith = '');

-- 3. Fix mining_company for Ore Samples
UPDATE rocks 
SET mining_company = 
  CASE 
    WHEN locality IS NOT NULL AND locality != '' THEN 'Mining operation at ' || locality
    ELSE 'Unspecified mining company'
  END
WHERE category = 'Ore Samples' AND (mining_company IS NULL OR mining_company = '');

-- 4. Fix associated_minerals for all rocks but especially Ore Samples
UPDATE rocks 
SET associated_minerals = 
  CASE
    WHEN mineral_composition IS NOT NULL AND mineral_composition != '' THEN mineral_composition
    WHEN category = 'Ore Samples' AND commodity_type IS NOT NULL AND commodity_type != '' THEN 'Minerals associated with ' || commodity_type
    ELSE 'No associated minerals recorded'
  END
WHERE associated_minerals IS NULL OR associated_minerals = '';

-- 5. Set default values for any remaining NULL values for these fields
UPDATE rocks 
SET foliation = 'Not applicable' WHERE foliation IS NULL;

UPDATE rocks 
SET protolith = 'Not applicable' WHERE protolith IS NULL;

UPDATE rocks 
SET mining_company = 'Not applicable' WHERE mining_company IS NULL;

UPDATE rocks 
SET associated_minerals = 'Not recorded' WHERE associated_minerals IS NULL;

-- Verify the fix
SELECT 
  id, 
  name, 
  category,
  foliation,
  protolith,
  mining_company,
  associated_minerals
FROM 
  rocks 
LIMIT 20; 