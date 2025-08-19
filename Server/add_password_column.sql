-- Add password column to students table
-- Run this in your Supabase SQL Editor

-- Add password column to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS password TEXT;

-- Add a comment to explain the column
COMMENT ON COLUMN public.students.password IS 'Student password for direct authentication';

-- Update RLS policies to allow password updates
-- Drop existing update policy
DROP POLICY IF EXISTS "Users can update own data" ON public.students;

-- Create new policy that includes password updates
CREATE POLICY "Users can update own data including password" 
  ON public.students
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Also allow admins to update any student's password
CREATE POLICY "Admins can update any student password" 
  ON public.students
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT (auth.jwt() ->> 'role')::text = 'admin')
  );

-- Grant necessary permissions
GRANT UPDATE ON public.students TO authenticated;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'students' AND column_name = 'password';
