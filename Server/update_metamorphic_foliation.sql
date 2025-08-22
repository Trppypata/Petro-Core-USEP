-- Update metamorphic rocks with foliation and foliation type data
-- Run this in your Supabase SQL editor

-- First, let's see what metamorphic rocks we have
SELECT 
  id, 
  name, 
  category, 
  foliation, 
  foliation_type 
FROM rocks 
WHERE category = 'Metamorphic' 
ORDER BY name;

-- Update foliation and foliation type data based on the spreadsheet
-- This matches the data from your Excel file

UPDATE rocks 
SET 
  foliation = 'Foliated',
  foliation_type = 'Gneissic banding'
WHERE name ILIKE '%Gneiss%' AND category = 'Metamorphic';

UPDATE rocks 
SET 
  foliation = 'Foliated',
  foliation_type = 'Schistose'
WHERE name ILIKE '%Antigorite%' AND category = 'Metamorphic';

UPDATE rocks 
SET 
  foliation = 'Foliated',
  foliation_type = 'S - surface foliation'
WHERE name ILIKE '%Mylonite%' AND category = 'Metamorphic';

UPDATE rocks 
SET 
  foliation = 'Foliated',
  foliation_type = 'Schistose'
WHERE name ILIKE '%Greenschist%' AND category = 'Metamorphic';

UPDATE rocks 
SET 
  foliation = 'Foliated',
  foliation_type = 'Schistose'
WHERE name ILIKE '%Mica Schist%' AND category = 'Metamorphic';

UPDATE rocks 
SET 
  foliation = 'Foliated',
  foliation_type = 'Phyllitic sheen'
WHERE name ILIKE '%Phyllite%' AND category = 'Metamorphic';

UPDATE rocks 
SET 
  foliation = 'Non - Foliated',
  foliation_type = 'Massive or scaly texture'
WHERE name ILIKE '%Serpentinite%' AND category = 'Metamorphic';

UPDATE rocks 
SET 
  foliation = 'Non - Foliated',
  foliation_type = 'N/A'
WHERE name ILIKE '%Marbleized Limestone%' AND category = 'Metamorphic';

UPDATE rocks 
SET 
  foliation = 'Non - Foliated',
  foliation_type = 'N/A'
WHERE name ILIKE '%Garnet Amphibolite%' AND category = 'Metamorphic';

UPDATE rocks 
SET 
  foliation = 'Foliated',
  foliation_type = 'Slatey'
WHERE name ILIKE '%Slate%' AND category = 'Metamorphic';

UPDATE rocks 
SET 
  foliation = 'Non - Foliated',
  foliation_type = 'N/A'
WHERE name ILIKE '%Eclogite%' AND category = 'Metamorphic';

UPDATE rocks 
SET 
  foliation = 'Non - Foliated',
  foliation_type = 'N/A'
WHERE name ILIKE '%Magnesite%' AND category = 'Metamorphic';

UPDATE rocks 
SET 
  foliation = 'Non - Foliated',
  foliation_type = 'N/A'
WHERE name ILIKE '%Quartzite%' AND category = 'Metamorphic';

UPDATE rocks 
SET 
  foliation = 'Non - Foliated',
  foliation_type = 'N/A'
WHERE name ILIKE '%Epidote with Pyrophyllite%' AND category = 'Metamorphic';

-- Verify the updates
SELECT 
  id, 
  name, 
  category, 
  foliation, 
  foliation_type 
FROM rocks 
WHERE category = 'Metamorphic' 
ORDER BY name;
