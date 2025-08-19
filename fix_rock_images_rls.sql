-- Fix RLS policies for rock_images table to allow anonymous users to read
-- Run this in your Supabase SQL Editor

-- First, let's check if the table exists and has RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'rock_images';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view rock images" ON rock_images;
DROP POLICY IF EXISTS "Authenticated users can insert rock images" ON rock_images;
DROP POLICY IF EXISTS "Authenticated users can update their own rock images" ON rock_images;
DROP POLICY IF EXISTS "Authenticated users can delete their own rock images" ON rock_images;
DROP POLICY IF EXISTS "Anonymous users can view rock images" ON rock_images;

-- Enable RLS if not already enabled
ALTER TABLE rock_images ENABLE ROW LEVEL SECURITY;

-- Create new, more permissive policies
-- Anonymous users can view rock images (public read access)
CREATE POLICY "Anonymous users can view rock images" 
  ON rock_images 
  FOR SELECT 
  TO anon
  USING (true);

-- Authenticated users can view rock images
CREATE POLICY "Authenticated users can view rock images" 
  ON rock_images 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Authenticated users can insert rock images
CREATE POLICY "Authenticated users can insert rock images" 
  ON rock_images 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Authenticated users can update rock images
CREATE POLICY "Authenticated users can update rock images" 
  ON rock_images 
  FOR UPDATE 
  TO authenticated 
  USING (true)
  WITH CHECK (true);

-- Authenticated users can delete rock images
CREATE POLICY "Authenticated users can delete rock images" 
  ON rock_images 
  FOR DELETE 
  TO authenticated 
  USING (true);

-- Grant necessary permissions
GRANT ALL ON rock_images TO authenticated;
GRANT SELECT ON rock_images TO anon;
GRANT USAGE ON SCHEMA public TO anon;

-- Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'rock_images';

-- Test the policies by checking if we can read from the table
SELECT COUNT(*) as total_images FROM rock_images;
