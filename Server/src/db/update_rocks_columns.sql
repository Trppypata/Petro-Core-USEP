-- Add missing columns to the rocks table

-- Check if coordinates column doesn't exist and add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rocks' AND column_name = 'coordinates'
    ) THEN
        ALTER TABLE rocks ADD COLUMN coordinates TEXT;
    END IF;
END$$;

-- Check if reaction_to_hcl column doesn't exist and add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rocks' AND column_name = 'reaction_to_hcl'
    ) THEN
        ALTER TABLE rocks ADD COLUMN reaction_to_hcl TEXT;
    END IF;
END$$;

-- Check if foliation_type column doesn't exist and add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rocks' AND column_name = 'foliation_type'
    ) THEN
        ALTER TABLE rocks ADD COLUMN foliation_type TEXT;
    END IF;
END$$;

-- Create/update index on rock name for faster search
DROP INDEX IF EXISTS rocks_name_idx;
CREATE INDEX rocks_name_idx ON rocks (name);

-- Add some comments to document the columns
COMMENT ON COLUMN rocks.coordinates IS 'Combined geographic coordinates in a human-readable format';
COMMENT ON COLUMN rocks.reaction_to_hcl IS 'Reaction to hydrochloric acid, used for carbonate identification';
COMMENT ON COLUMN rocks.foliation_type IS 'Specific type of foliation in metamorphic rocks (e.g., schistosity, gneissic banding)';

-- Log that the update was successful
DO $$
BEGIN
    RAISE NOTICE 'Successfully added missing columns to rocks table';
END$$; 