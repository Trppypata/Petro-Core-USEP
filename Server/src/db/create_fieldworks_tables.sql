-- Create the fieldworks table
CREATE TABLE IF NOT EXISTS public.fieldworks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  path TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on path for faster lookups
CREATE INDEX IF NOT EXISTS fieldworks_path_idx ON public.fieldworks (path);

-- Create the fieldwork sections table
CREATE TABLE IF NOT EXISTS public.fieldwork_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fieldwork_id UUID NOT NULL REFERENCES public.fieldworks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on fieldwork_id for faster lookups
CREATE INDEX IF NOT EXISTS fieldwork_sections_fieldwork_id_idx ON public.fieldwork_sections (fieldwork_id);

-- Create the fieldwork files table
CREATE TABLE IF NOT EXISTS public.fieldwork_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  fieldwork_id UUID NOT NULL REFERENCES public.fieldworks(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.fieldwork_sections(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('chapter', 'assignment')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS fieldwork_files_fieldwork_id_idx ON public.fieldwork_files (fieldwork_id);
CREATE INDEX IF NOT EXISTS fieldwork_files_section_id_idx ON public.fieldwork_files (section_id); 