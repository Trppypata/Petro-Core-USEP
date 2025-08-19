const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addPasswordColumn() {
  try {
    console.log('🔧 Adding password column to students table...');
    
    // SQL commands to execute
    const sqlCommands = [
      // Add password column
      `ALTER TABLE public.students ADD COLUMN IF NOT EXISTS password TEXT;`,
      
      // Add comment
      `COMMENT ON COLUMN public.students.password IS 'Student password for direct authentication';`,
      
      // Drop existing policy
      `DROP POLICY IF EXISTS "Users can update own data" ON public.students;`,
      
      // Create new policy for password updates
      `CREATE POLICY "Users can update own data including password" 
        ON public.students
        FOR UPDATE
        TO authenticated
        USING (user_id = auth.uid());`,
      
      // Create admin policy
      `CREATE POLICY "Admins can update any student password" 
        ON public.students
        FOR UPDATE
        TO authenticated
        USING (
          (SELECT (auth.jwt() ->> 'role')::text = 'admin')
        );`,
      
      // Grant permissions
      `GRANT UPDATE ON public.students TO authenticated;`
    ];

    // Execute each SQL command
    for (const sql of sqlCommands) {
      console.log(`Executing: ${sql.substring(0, 50)}...`);
      const { error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        console.error('❌ Error executing SQL:', error);
      } else {
        console.log('✅ SQL executed successfully');
      }
    }

    // Verify the column was added
    console.log('🔍 Verifying password column was added...');
    const { data, error } = await supabase
      .from('students')
      .select('password')
      .limit(1);

    if (error) {
      console.error('❌ Error verifying column:', error);
    } else {
      console.log('✅ Password column verification successful');
      console.log('✅ Password column has been added to students table!');
    }

  } catch (error) {
    console.error('❌ Error adding password column:', error);
  }
}

// Run the function
addPasswordColumn();
