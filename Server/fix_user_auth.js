const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixUserAuth() {
  try {
    console.log('🔍 Checking user authentication setup...');
    
    const email = 'pabionated@gmail.com';
    const password = '123123';
    
    // 1. Check if user exists in students table
    console.log('📋 Checking students table...');
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('email', email)
      .single();
    
    if (studentError || !studentData) {
      console.error('❌ Student not found in students table');
      return;
    }
    
    console.log('✅ Student found in students table:', studentData.id);
    
    // 2. Check if user exists in Supabase Auth
    console.log('🔐 Checking Supabase Auth...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error listing auth users:', authError);
      return;
    }
    
    const authUser = authUsers.users.find(user => user.email === email);
    
    if (!authUser) {
      console.log('⚠️ User not found in Supabase Auth, creating one...');
      
      // Create user in Supabase Auth
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          first_name: studentData.first_name || studentData.student_name,
          last_name: studentData.last_name,
          role: 'student'
        }
      });
      
      if (createError) {
        console.error('❌ Error creating auth user:', createError);
        return;
      }
      
      console.log('✅ Auth user created:', newUser.user.id);
      
      // Update student record with user_id
      const { error: updateError } = await supabase
        .from('students')
        .update({ user_id: newUser.user.id })
        .eq('id', studentData.id);
      
      if (updateError) {
        console.error('❌ Error updating student with user_id:', updateError);
      } else {
        console.log('✅ Student record updated with user_id');
      }
      
    } else {
      console.log('✅ User found in Supabase Auth:', authUser.id);
      
      // Update password if needed
      console.log('🔐 Updating password in Supabase Auth...');
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        authUser.id,
        { password: password }
      );
      
      if (updateError) {
        console.error('❌ Error updating password:', updateError);
      } else {
        console.log('✅ Password updated in Supabase Auth');
      }
      
      // Update student record with user_id if missing
      if (!studentData.user_id) {
        const { error: updateError } = await supabase
          .from('students')
          .update({ user_id: authUser.id })
          .eq('id', studentData.id);
        
        if (updateError) {
          console.error('❌ Error updating student with user_id:', updateError);
        } else {
          console.log('✅ Student record updated with user_id');
        }
      }
    }
    
    console.log('🎉 User authentication setup complete!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 You can now login with these credentials');
    
  } catch (error) {
    console.error('❌ Error fixing user auth:', error);
  }
}

// Run the function
fixUserAuth();
