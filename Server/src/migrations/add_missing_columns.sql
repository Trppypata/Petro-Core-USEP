-- Add missing columns to the rocks table

-- Add coordinates column if it doesn't exist
ALTER TABLE rocks ADD COLUMN IF NOT EXISTS coordinates TEXT;

-- Add reaction_to_hcl column if it doesn't exist
ALTER TABLE rocks ADD COLUMN IF NOT EXISTS reaction_to_hcl TEXT;

-- Add foliation_type column if it doesn't exist
ALTER TABLE rocks ADD COLUMN IF NOT EXISTS foliation_type TEXT;

-- Create index on rock name
CREATE INDEX IF NOT EXISTS rocks_name_idx ON rocks (name);

-- Add some comments to document the columns
COMMENT ON COLUMN rocks.coordinates IS 'Combined geographic coordinates in a human-readable format';
COMMENT ON COLUMN rocks.reaction_to_hcl IS 'Reaction to hydrochloric acid, used for carbonate identification';
COMMENT ON COLUMN rocks.foliation_type IS 'Specific type of foliation in metamorphic rocks (e.g., schistosity, gneissic banding)'; 