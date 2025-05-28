import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

// Login user
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // First authenticate the user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }

    // Check if we have a corresponding student record
    if (data.user) {
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      if (!studentError && studentData) {
        // Add student data to the response
        return res.status(200).json({
          success: true,
          data: {
            ...data,
            student: studentData
          },
        });
      }
    }

    // Return user and session (without student data if not found)
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Register user
export const register = async (req: Request, res: Response) => {
  try {
    console.log('Register request received:', {
      body: req.body,
      headers: req.headers['content-type']
    });
    
    const { email, password, firstName, lastName, role = 'student' } = req.body;

    console.log('Parsed values:', { email, password: '***', firstName, lastName, role });

    if (!email || !password) {
      console.log('Registration failed: Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Validate role
    if (role !== 'student' && role !== 'admin') {
      console.log('Registration failed: Invalid role', role);
      return res.status(400).json({
        success: false,
        message: 'Role must be either "student" or "admin"',
      });
    }

    // 1. First create the auth user
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: role,
          },
          emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`,
        },
      });
      
      if (authError) {
        console.log('Supabase registration error:', authError);
        return res.status(400).json({
          success: false,
          message: authError.message || 'Authentication failed',
        });
      }
      
      // If signup was successful, auto-confirm the email address
      if (authData?.user) {
        try {
          // Small delay to ensure the user is fully created in the Supabase system
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Use the admin API to update the user's email confirmation status
          await supabase.auth.admin.updateUserById(
            authData.user.id,
            { email_confirm: true }
          );
          console.log('User email auto-confirmed');
        } catch (confirmError) {
          console.error('Failed to auto-confirm email:', confirmError);
          // Continue anyway as the user was created
        }
      }

      if (!authData || !authData.user) {
        return res.status(400).json({
          success: false,
          message: 'User creation failed - no user data returned',
        });
      }

      // 2. If authentication successful, create a student record
      if (authData.user && role === 'student') {
        try {
          // Create full student name
          const studentName = `${firstName} ${lastName}`;
          
          // Initial default values for a new student
          const { error: studentError } = await supabase
            .from('students')
            .insert({
              user_id: authData.user.id,
              first_name: firstName,
              last_name: lastName,
              middle_name: '', // Default empty
              email: email,
              position: 'student',
              team: 'BSIT', // Default team/course
              salary: 0, // Default tuition amount
              allowance: 0, // Default allowance
              contact: '', // Will be updated later
              profile_url: '', // Will be updated later
              address: '', // Will be updated later
              status: 'active',
              student_name: studentName
            });

          if (studentError) {
            console.error('Error creating student record:', studentError);
            // But still return success since auth was created
            console.log('Auth user created but student record failed:', studentError.message);
            
            return res.status(201).json({
              success: true,
              data: authData,
              warning: 'User created but student profile could not be initialized: ' + studentError.message,
            });
          } else {
            console.log('Student record created successfully');
          }
        } catch (studentError) {
          console.error('Exception creating student record:', studentError);
          // Return success with warning
          return res.status(201).json({
            success: true,
            data: authData,
            warning: 'User created but student profile could not be initialized due to an error',
          });
        }
      }

      return res.status(201).json({
        success: true,
        data: authData,
      });
    } catch (authError: any) {
      console.error('Authentication error details:', authError);
      return res.status(400).json({
        success: false,
        message: authError.message || 'Authentication failed',
        details: authError.details || 'Unknown error'
      });
    }
  } catch (error: any) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

// Get current user
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is required',
      });
    }
    
    // Set the auth token to get the user
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }

    // Check if we have a corresponding student record
    if (user) {
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!studentError && studentData) {
        return res.status(200).json({
          success: true,
          data: { 
            user,
            student: studentData
          },
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Logout user
export const logout = async (req: Request, res: Response) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Reset password
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: process.env.PASSWORD_RESET_REDIRECT_URL,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Password reset email sent',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Update password
export const updatePassword = async (req: Request, res: Response) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'New password is required',
      });
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Update password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}; 