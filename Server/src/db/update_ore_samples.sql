-- Update any inconsistent 'Ore Samples' casing
UPDATE rocks
SET category = 'Ore Samples'
WHERE LOWER(category) = LOWER('Ore Samples') AND category != 'Ore Samples';

-- Make sure all commodity_type, ore_group, and mining_company fields are properly set for Ore Samples
-- Copy values from other fields if they exist but the specific ore fields don't
UPDATE rocks
SET commodity_type = COALESCE(commodity_type, type, '')
WHERE category = 'Ore Samples' AND (commodity_type IS NULL OR commodity_type = '');

UPDATE rocks
SET ore_group = COALESCE(ore_group, mineral_composition, '')
WHERE category = 'Ore Samples' AND (ore_group IS NULL OR ore_group = '');

-- Add 'O-' prefix to rock_code for Ore Samples if it doesn't already have one
UPDATE rocks
SET rock_code = CONCAT('O-', LPAD(SUBSTRING(rock_code FROM 3), 4, '0'))
WHERE category = 'Ore Samples' AND rock_code NOT LIKE 'O-%';

-- Set a helpful description if it's missing
UPDATE rocks
SET description = CONCAT('Ore sample containing ', COALESCE(commodity_type, type, 'minerals'), 
                         ' from ', COALESCE(locality, 'unknown location'))
WHERE category = 'Ore Samples' AND (description IS NULL OR description = '');

-- Log the number of Ore Samples after fixes
DO $$
DECLARE
  ore_count INT;
BEGIN
  SELECT COUNT(*) INTO ore_count FROM rocks WHERE category = 'Ore Samples';
  RAISE NOTICE 'Total Ore Samples after fixes: %', ore_count;
END $$; 