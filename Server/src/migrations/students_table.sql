-- Create students table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  middle_name TEXT,
  email TEXT NOT NULL UNIQUE,
  position TEXT NOT NULL DEFAULT 'student',
  team TEXT NOT NULL, -- department/course
  salary NUMERIC(10, 2) NOT NULL, -- tuition
  allowance NUMERIC(10, 2) NOT NULL,
  contact TEXT NOT NULL,
  profile_url TEXT,
  address TEXT,
  status TEXT DEFAULT 'active',
  student_name TEXT NOT NULL,
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
CREATE TRIGGER update_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Admin can do everything
CREATE POLICY "Admins have full access" ON public.students
  FOR ALL 
  TO authenticated
  USING (
    (SELECT (auth.jwt() ->> 'role')::text = 'admin')
  );

-- Users can view all students
CREATE POLICY "Users can view all students" ON public.students
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON public.students
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Grant permissions
GRANT ALL ON public.students TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON public.students TO authenticated; 