-- This is a SQL script to be run directly in the database to add missing columns
-- Run this script using psql or your database administration tool

-- Add coordinates column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'rocks' 
          AND column_name = 'coordinates'
    ) THEN
        ALTER TABLE public.rocks ADD COLUMN coordinates TEXT;
        RAISE NOTICE 'Added coordinates column';
    ELSE
        RAISE NOTICE 'coordinates column already exists';
    END IF;
END $$;

-- Add reaction_to_hcl column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'rocks' 
          AND column_name = 'reaction_to_hcl'
    ) THEN
        ALTER TABLE public.rocks ADD COLUMN reaction_to_hcl TEXT;
        RAISE NOTICE 'Added reaction_to_hcl column';
    ELSE
        RAISE NOTICE 'reaction_to_hcl column already exists';
    END IF;
END $$;

-- Add foliation_type column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'rocks' 
          AND column_name = 'foliation_type'
    ) THEN
        ALTER TABLE public.rocks ADD COLUMN foliation_type TEXT;
        RAISE NOTICE 'Added foliation_type column';
    ELSE
        RAISE NOTICE 'foliation_type column already exists';
    END IF;
END $$;

-- Create index on name if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_indexes
        WHERE tablename = 'rocks' 
          AND indexname = 'rocks_name_idx'
    ) THEN
        CREATE INDEX rocks_name_idx ON public.rocks (name);
        RAISE NOTICE 'Created index on rocks.name';
    ELSE
        RAISE NOTICE 'Index on rocks.name already exists';
    END IF;
END $$;

-- Print a completion message
DO $$ 
BEGIN
    RAISE NOTICE 'Schema update completed successfully';
END $$; 