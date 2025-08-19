-- Remove contact column from students table
-- Run this in your Supabase SQL Editor

-- Remove contact column from students table
ALTER TABLE public.students 
DROP COLUMN IF EXISTS contact;

-- Verify the column was removed
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'students' AND column_name = 'contact';

-- Should return no rows if contact column was successfully removed
