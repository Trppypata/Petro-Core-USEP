-- Create minerals table
CREATE TABLE IF NOT EXISTS public.minerals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mineral_code TEXT UNIQUE,
  mineral_name TEXT NOT NULL,
  chemical_formula TEXT,
  mineral_group TEXT NOT NULL,
  color TEXT,
  streak TEXT,
  luster TEXT,
  hardness TEXT,
  cleavage TEXT,
  fracture TEXT,
  habit TEXT,
  crystal_system TEXT,
  category TEXT NOT NULL, -- BORATES, SULFATES, etc.
  type TEXT NOT NULL, -- mineral or rock
  specific_gravity TEXT,
  transparency TEXT,
  occurrence TEXT,
  uses TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to call the function before update
CREATE TRIGGER update_minerals_updated_at
BEFORE UPDATE ON public.minerals
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE public.minerals ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Admin can do everything
CREATE POLICY "Admins have full access to minerals" ON public.minerals
  FOR ALL 
  TO authenticated
  USING (
    (SELECT (auth.jwt() ->> 'role')::text = 'admin')
  );

-- Users can view all minerals
CREATE POLICY "Users can view all minerals" ON public.minerals
  FOR SELECT
  TO authenticated
  USING (true);

-- Grant permissions
GRANT ALL ON public.minerals TO postgres, service_role;
GRANT SELECT ON public.minerals TO authenticated; 