-- Add coordinates column if it doesn't exist
ALTER TABLE IF EXISTS rocks 
ADD COLUMN IF NOT EXISTS coordinates TEXT;

-- Update the coordinates field for existing records where latitude and longitude are available
UPDATE rocks
SET coordinates = CONCAT(latitude, ', ', longitude)
WHERE latitude IS NOT NULL 
AND longitude IS NOT NULL 
AND (coordinates IS NULL OR coordinates = '');

-- Create an index on coordinates for faster lookups
CREATE INDEX IF NOT EXISTS rocks_coordinates_idx ON rocks (coordinates);

-- Create a database function to automatically update coordinates when latitude or longitude changes
CREATE OR REPLACE FUNCTION update_coordinates()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL) THEN
    NEW.coordinates = CONCAT(NEW.latitude, ', ', NEW.longitude);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update coordinates when latitude or longitude changes
DROP TRIGGER IF EXISTS update_rocks_coordinates ON rocks;
CREATE TRIGGER update_rocks_coordinates
  BEFORE INSERT OR UPDATE OF latitude, longitude ON rocks
  FOR EACH ROW
  EXECUTE FUNCTION update_coordinates();

-- Log that the migration was executed
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Added coordinates column and set up automatic updates';
END $$; 