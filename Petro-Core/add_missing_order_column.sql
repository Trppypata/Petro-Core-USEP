-- Add the missing 'order' column to fieldwork_sections table
ALTER TABLE public.fieldwork_sections ADD COLUMN IF NOT EXISTS "order" INT DEFAULT 1;

-- Update existing rows to have sequential ordering
-- This will set the order value based on the id (assuming id is sequential)
-- Adjust this logic if you need a different ordering
WITH numbered_rows AS (
  SELECT id, ROW_NUMBER() OVER() AS row_num
  FROM public.fieldwork_sections
)
UPDATE public.fieldwork_sections
SET "order" = numbered_rows.row_num
FROM numbered_rows
WHERE fieldwork_sections.id = numbered_rows.id;

-- Comment this out if you don't want to display the results
SELECT id, "order", * FROM public.fieldwork_sections ORDER BY "order"; 