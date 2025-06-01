import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import IUser from '../models/user.model';

// Count total users
export const countUsers = async (_req: Request, res: Response) => {
  try {
    const { count, error } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      totalUsers: count,
    });
  } catch (error) {
    console.error('Count users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Register student
export const registerStudent = async (req: Request, res: Response) => {
  try {
    const userData: IUser = req.body;
    
    if (!userData.email || !userData.password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // First create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        first_name: userData.first_name,
        last_name: userData.last_name,
      },
    });

    if (authError) {
      return res.status(400).json({
        success: false,
        message: authError.message,
      });
    }

    // Create student record
    const student_name = `${userData.first_name} ${userData.middle_name ? userData.middle_name + ' ' : ''}${userData.last_name}`;
    
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .insert({
        user_id: authData.user.id,
        first_name: userData.first_name,
        last_name: userData.last_name,
        middle_name: userData.middle_name || '',
        email: userData.email,
        position: userData.position || 'student',
        team: userData.team,
        salary: userData.salary,
        allowance: userData.allowance,
        contact: userData.contact,
        profile_url: userData.profile_url || '',
        address: userData.address || '',
        status: 'active',
        student_name: student_name
      })
      .select()
      .single();

    if (studentError) {
      // If student creation fails, delete the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      return res.status(400).json({
        success: false,
        message: studentError.message,
      });
    }

    return res.status(201).json({
      success: true,
      data: studentData,
    });
  } catch (error) {
    console.error('Register student error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Fetch all user details
export const fetchUserDetails = async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Fetch user details error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Update user
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userData: Partial<IUser> = req.body;
    
    // Update student name if first or last name is provided
    if (userData.first_name || userData.last_name) {
      const { data: currentUser } = await supabase
        .from('students')
        .select('first_name, last_name, middle_name')
        .eq('user_id', id)
        .single();
      
      if (currentUser) {
        const firstName = userData.first_name || currentUser.first_name;
        const lastName = userData.last_name || currentUser.last_name;
        const middleName = userData.middle_name !== undefined ? userData.middle_name : currentUser.middle_name;
        
        userData.student_name = `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`;
      }
    }
    
    const { data, error } = await supabase
      .from('students')
      .update(userData)
      .eq('user_id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Delete user
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // First check if user exists
    const { data: user, error: fetchError } = await supabase
      .from('students')
      .select('user_id')
      .eq('user_id', id)
      .single();
    
    if (fetchError || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    // Delete from students table
    const { error: deleteError } = await supabase
      .from('students')
      .delete()
      .eq('user_id', id);
      
    if (deleteError) {
      return res.status(400).json({
        success: false,
        message: deleteError.message,
      });
    }
    
    // Delete auth user
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(id);
    
    if (authDeleteError) {
      console.error('Failed to delete auth user:', authDeleteError);
      // We still return success since the student record was deleted
    }

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get all available teams/courses
export const getTeams = async (_req: Request, res: Response) => {
  try {
    // Predefined list of courses
    const courses = [
      'BSIT', // Bachelor of Science in Information Technology
      'BSCS', // Bachelor of Science in Computer Science
      'BSA',  // Bachelor of Science in Accountancy
      'BSBA', // Bachelor of Science in Business Administration
      'BSN',  // Bachelor of Science in Nursing
      'BSE',  // Bachelor of Science in Engineering
    ];

    return res.status(200).json({
      success: true,
      data: courses,
    });
  } catch (error) {
    console.error('Get teams error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}; 