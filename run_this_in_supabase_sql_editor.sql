-- IMPORTANT: Run this SQL in your Supabase SQL Editor to create the rock_images table

-- Check if uuid-ossp extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create rock_images table if it doesn't exist
CREATE TABLE IF NOT EXISTS rock_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rock_id UUID NOT NULL REFERENCES rocks(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS rock_images_rock_id_idx ON rock_images(rock_id);

-- Add comment to table
COMMENT ON TABLE rock_images IS 'Stores multiple images for rock specimens';

-- Add comments to columns
COMMENT ON COLUMN rock_images.id IS 'Primary key for the rock image';
COMMENT ON COLUMN rock_images.rock_id IS 'Foreign key referencing the rocks table';
COMMENT ON COLUMN rock_images.image_url IS 'URL to the image in storage';
COMMENT ON COLUMN rock_images.caption IS 'Optional caption for the image';
COMMENT ON COLUMN rock_images.display_order IS 'Order in which images should be displayed';
COMMENT ON COLUMN rock_images.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN rock_images.updated_at IS 'Timestamp when the record was last updated';

-- Add RLS policies for security
ALTER TABLE rock_images ENABLE ROW LEVEL SECURITY;

-- Anyone can view rock images
CREATE POLICY "Anyone can view rock images" 
  ON rock_images 
  FOR SELECT 
  USING (true);

-- Only authenticated users can insert rock images
CREATE POLICY "Authenticated users can insert rock images" 
  ON rock_images 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Only authenticated users can update their own rock images
CREATE POLICY "Authenticated users can update their own rock images" 
  ON rock_images 
  FOR UPDATE 
  TO authenticated 
  USING (true)
  WITH CHECK (true);

-- Only authenticated users can delete their own rock images
CREATE POLICY "Authenticated users can delete their own rock images" 
  ON rock_images 
  FOR DELETE 
  TO authenticated 
  USING (true);

-- If the table was created successfully, insert a test record
INSERT INTO rock_images (rock_id, image_url, caption)
SELECT 
  id, 
  'https://example.com/test-image.jpg',
  'Test image - if you see this, the table was created successfully!'
FROM rocks
LIMIT 1;

-- Display what's in the table now
SELECT * FROM rock_images LIMIT 10; 