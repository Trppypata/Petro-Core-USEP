-- Add missing columns for rocks Excel import
-- Run this in your Supabase SQL editor

-- Check and add missing columns
ALTER TABLE IF EXISTS rocks 
ADD COLUMN IF NOT EXISTS streak TEXT,
ADD COLUMN IF NOT EXISTS origin TEXT,
ADD COLUMN IF NOT EXISTS foliation_type TEXT,
ADD COLUMN IF NOT EXISTS associated_minerals TEXT,
ADD COLUMN IF NOT EXISTS mining_company TEXT;

-- Confirm columns are present in database
SELECT 
  column_name, 
  data_type
FROM 
  information_schema.columns 
WHERE 
  table_name = 'rocks' 
AND 
  column_name IN ('streak', 'origin', 'foliation_type', 'associated_minerals', 'mining_company'); 