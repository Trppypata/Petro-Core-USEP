-- Create the rocks table
CREATE TABLE IF NOT EXISTS rocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rock_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  chemical_formula TEXT,
  hardness TEXT,
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  depositional_environment TEXT,
  grain_size TEXT,
  color TEXT,
  texture TEXT,
  luster TEXT,
  streak TEXT,
  reaction_to_hcl TEXT,
  magnetism TEXT,
  origin TEXT,
  latitude TEXT,
  longitude TEXT,
  coordinates TEXT,
  locality TEXT,
  mineral_composition TEXT,
  description TEXT,
  formation TEXT,
  geological_age TEXT,
  status TEXT DEFAULT 'active',
  image_url TEXT,
  -- Metamorphic rock specific fields
  associated_minerals TEXT,
  metamorphism_type TEXT,
  metamorphic_grade TEXT,
  parent_rock TEXT,
  protolith TEXT,
  foliation TEXT,
  foliation_type TEXT,
  -- Igneous rock specific fields
  silica_content TEXT,
  cooling_rate TEXT,
  mineral_content TEXT,
  -- Sedimentary rock specific fields
  bedding TEXT,
  sorting TEXT,
  roundness TEXT,
  fossil_content TEXT,
  sediment_source TEXT,
  -- Ore samples specific fields
  commodity_type TEXT,
  ore_group TEXT,
  mining_company TEXT,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add Row Level Security (RLS) policies
ALTER TABLE rocks ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read all rocks
CREATE POLICY "Authenticated users can read rocks"
  ON rocks
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy for anonymous users to read all rocks
CREATE POLICY "Anonymous users can read rocks"
  ON rocks
  FOR SELECT
  TO anon
  USING (true);

-- Create policy for authenticated users to insert rocks
CREATE POLICY "Authenticated users can insert rocks"
  ON rocks
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy for authenticated users to update their own rocks
CREATE POLICY "Authenticated users can update rocks"
  ON rocks
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policy for authenticated users to delete rocks
CREATE POLICY "Authenticated users can delete rocks"
  ON rocks
  FOR DELETE
  TO authenticated
  USING (true);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at column
CREATE TRIGGER update_rocks_updated_at
  BEFORE UPDATE ON rocks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index on rock_code for faster lookups
CREATE INDEX IF NOT EXISTS rocks_rock_code_idx ON rocks (rock_code);

-- Create index on category for faster filtering
CREATE INDEX IF NOT EXISTS rocks_category_idx ON rocks (category); 