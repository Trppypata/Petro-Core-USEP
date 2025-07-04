-- This migration adds the 'order' column to the fieldwork_sections table if it doesn't exist
-- Run this in the Supabase SQL Editor to fix missing column errors

-- Check if the order column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'fieldwork_sections'
        AND column_name = 'order'
    ) THEN
        -- Add the order column if it doesn't exist
        ALTER TABLE public.fieldwork_sections
        ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;

        RAISE NOTICE 'Added "order" column to fieldwork_sections table';
    ELSE
        RAISE NOTICE '"order" column already exists in fieldwork_sections table';
    END IF;
END $$; 