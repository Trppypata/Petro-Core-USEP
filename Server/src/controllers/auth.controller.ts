import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

// Login user - OPTIMIZED VERSION
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Use Promise.all to run both calls in parallel
    const [authResult, studentResult] = await Promise.all([
      supabase.auth.signInWithPassword({ email, password }),
      // Pre-fetch student data if user exists (we'll check the result later)
      supabase.from('students').select('*').eq('email', email).single()
    ]);

    if (authResult.error) {
      return res.status(401).json({
        success: false,
        message: authResult.error.message,
      });
    }

    // If we have both user and student data, return combined response
    if (authResult.data.user && studentResult.data && !studentResult.error) {
      return res.status(200).json({
        success: true,
        data: {
          ...authResult.data,
          student: studentResult.data
        },
      });
    }

    // Return user and session (without student data if not found)
    return res.status(200).json({
      success: true,
      data: authResult.data,
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
    console.log('Register request received:', req.body);
    const { email, password, firstName, lastName, role = 'student' } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, first name, and last name are required',
      });
    }

    if (role && !['student', 'admin'].includes(role)) {
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
      if (role === 'student') {
        const studentData = {
          user_id: authData.user.id,
          first_name: firstName,
          last_name: lastName,
          email: email,
          position: role,
          team: "BSIT",
          salary: 0,
          allowance: 0,
          profile_url: "",
          address: "",
          status: "active",
        };

        const { data: studentResult, error: studentError } = await supabase
          .from('students')
          .insert([studentData])
          .select()
          .single();

        if (studentError) {
          console.error('Student creation error:', studentError);
          // Try to clean up auth user if student creation fails
          try {
            await supabase.auth.admin.deleteUser(authData.user.id);
          } catch (cleanupError) {
            console.error('Failed to cleanup auth user:', cleanupError);
          }
          return res.status(400).json({
            success: false,
            message: 'Failed to create student record',
          });
        }

        return res.status(201).json({
          success: true,
          data: {
            user: authData.user,
            session: authData.session,
            student: studentResult,
          },
        });
      }

      // For admin users, just return the auth data
      return res.status(201).json({
        success: true,
        data: {
          user: authData.user,
          session: authData.session,
        },
      });

    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
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
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password`,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Password reset email sent successfully',
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
        message: 'Password is required',
      });
    }

    const { error } = await supabase.auth.updateUser({
      password: password,
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

// Update specific user password (admin function)
export const updateUserPassword = async (req: Request, res: Response) => {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({
        success: false,
        message: 'User ID and password are required',
      });
    }

    // Update password in Supabase Auth
    const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
      password: password,
    });

    if (authError) {
      console.error('Auth password update error:', authError);
      return res.status(400).json({
        success: false,
        message: `Failed to update password in authentication system: ${authError.message}`,
      });
    }

    // Update password in students table
    const { error: dbError } = await supabase
      .from('students')
      .update({ password: password })
      .eq('user_id', userId);

    if (dbError) {
      console.error('Database password update error:', dbError);
      return res.status(400).json({
        success: false,
        message: `Failed to update password in database: ${dbError.message}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully in both authentication system and database',
    });
  } catch (error) {
    console.error('Update user password error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};

// Update user role (admin function)
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({
        success: false,
        message: 'User ID and role are required',
      });
    }

    if (!['student', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either "student" or "admin"',
      });
    }

    // Update role in Supabase Auth
    const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { role: role },
    });

    if (authError) {
      console.error('Auth role update error:', authError);
      return res.status(400).json({
        success: false,
        message: `Failed to update role in authentication system: ${authError.message}`,
      });
    }

    // Update role in students table
    const { error: dbError } = await supabase
      .from('students')
      .update({ position: role })
      .eq('user_id', userId);

    if (dbError) {
      console.error('Database role update error:', dbError);
      return res.status(400).json({
        success: false,
        message: `Failed to update role in database: ${dbError.message}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Role updated successfully in both authentication system and database',
    });
  } catch (error) {
    console.error('Update user role error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}; 