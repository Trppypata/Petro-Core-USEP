-- Add missing fields from Excel files to the rocks table
ALTER TABLE IF EXISTS rocks 
ADD COLUMN IF NOT EXISTS luster TEXT,
ADD COLUMN IF NOT EXISTS streak TEXT,
ADD COLUMN IF NOT EXISTS reaction_to_hcl TEXT,
ADD COLUMN IF NOT EXISTS magnetism TEXT,
ADD COLUMN IF NOT EXISTS origin TEXT,
ADD COLUMN IF NOT EXISTS protolith TEXT,
ADD COLUMN IF NOT EXISTS foliation_type TEXT;

-- Log that the migration was executed
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Added missing fields to rocks table';
END $$; 