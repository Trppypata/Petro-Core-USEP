-- Add missing columns from Excel sheets to the rocks table

-- First, check if luster and magnetism columns exist (they're defined in model but filtered out in controller)
DO $$
BEGIN
    -- Check if specific_gravity column doesn't exist and add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rocks' AND column_name = 'specific_gravity'
    ) THEN
        ALTER TABLE rocks ADD COLUMN specific_gravity TEXT;
        RAISE NOTICE 'Added specific_gravity column to rocks table';
    END IF;

    -- Check if cleavage column doesn't exist and add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rocks' AND column_name = 'cleavage'
    ) THEN
        ALTER TABLE rocks ADD COLUMN cleavage TEXT;
        RAISE NOTICE 'Added cleavage column to rocks table';
    END IF;

    -- Check if fracture column doesn't exist and add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rocks' AND column_name = 'fracture'
    ) THEN
        ALTER TABLE rocks ADD COLUMN fracture TEXT;
        RAISE NOTICE 'Added fracture column to rocks table';
    END IF;

    -- Check if crystal_system column doesn't exist and add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rocks' AND column_name = 'crystal_system'
    ) THEN
        ALTER TABLE rocks ADD COLUMN crystal_system TEXT;
        RAISE NOTICE 'Added crystal_system column to rocks table';
    END IF;

    -- Make sure luster exists (it should be in the schema but is being filtered out)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rocks' AND column_name = 'luster'
    ) THEN
        ALTER TABLE rocks ADD COLUMN luster TEXT;
        RAISE NOTICE 'Added luster column to rocks table';
    END IF;

    -- Make sure magnetism exists (it should be in the schema but is being filtered out)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rocks' AND column_name = 'magnetism'
    ) THEN
        ALTER TABLE rocks ADD COLUMN magnetism TEXT;
        RAISE NOTICE 'Added magnetism column to rocks table';
    END IF;
END$$;

-- Add some comments to document the columns
COMMENT ON COLUMN rocks.specific_gravity IS 'Specific gravity or density of the rock';
COMMENT ON COLUMN rocks.cleavage IS 'The tendency of a rock to break along certain planes';
COMMENT ON COLUMN rocks.fracture IS 'The pattern or characteristic of how a rock breaks when not along cleavage planes';
COMMENT ON COLUMN rocks.crystal_system IS 'The crystallographic system for crystalline rocks';
COMMENT ON COLUMN rocks.luster IS 'The way light interacts with the surface of the rock';
COMMENT ON COLUMN rocks.magnetism IS 'The magnetic properties of the rock';

-- Log that the update was successful
DO $$
BEGIN
    RAISE NOTICE 'Successfully added missing columns to rocks table';
END$$; 