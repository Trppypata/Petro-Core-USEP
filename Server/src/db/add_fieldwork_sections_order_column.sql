-- Add the 'order' column to the fieldwork_sections table if it doesn't exist
ALTER TABLE public.fieldwork_sections 
ADD COLUMN IF NOT EXISTS "order" INT DEFAULT 1;

-- Update existing records with sequential ordering
WITH numbered_rows AS (
  SELECT 
    id, 
    ROW_NUMBER() OVER (PARTITION BY fieldwork_id ORDER BY id) AS row_num
  FROM 
    public.fieldwork_sections
)
UPDATE public.fieldwork_sections
SET "order" = numbered_rows.row_num
FROM numbered_rows
WHERE fieldwork_sections.id = numbered_rows.id;

-- Show the updated table
SELECT id, fieldwork_id, title, "order" FROM public.fieldwork_sections ORDER BY fieldwork_id, "order"; 