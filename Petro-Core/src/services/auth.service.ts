import axios from 'axios';
import { supabase } from '@/lib/supabase';

// API base URL
const API_URL = 'https://petro-core-usep.onrender.com';

// Configure axios to use the token for all requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends AuthCredentials {
  firstName: string;
  lastName: string;
  role?: 'student' | 'admin';
}

export const authService = {
  /**
   * Login with email and password - now uses Supabase Auth
   */
  async login({ email, password }: AuthCredentials) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      throw new Error(error.message || 'Login failed');
    }
    // Supabase automatically persists session if configured
    if (data.user) {
      return { user: data.user, session: data.session };
    }
    return null;
  },

  /**
   * Register a new user
   */
  async register({ email, password, firstName, lastName, role = 'student' }: RegisterCredentials) {
    try {
      console.log('Sending registration data:', { 
        email, 
        password: '***', 
        firstName, 
        lastName, 
        role,
        endpoint: `${API_URL}/api/auth/register`
      });
      
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        email,
        password,
        firstName,
        lastName,
        role,
      });
      
      console.log('Registration successful:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('Registration error details:', error);
      if (axios.isAxiosError(error)) {
        console.error('Server response status:', error.response?.status);
        console.error('Server response data:', error.response?.data);
        
        // Provide a more specific error message
        const errorMessage = error.response?.data?.message || 
                            error.message || 
                            'Registration failed';
                            
        throw new Error(errorMessage);
      }
      throw error;
    }
  },

  /**
   * Send password reset email
   */
  async resetPassword(email: string) {
    try {
      const response = await axios.post(`${API_URL}/api/auth/reset-password`, {
        email
      });
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Password reset failed');
      }
      throw error;
    }
  },

  /**
   * Update user password after reset
   */
  async updatePassword(password: string) {
    try {
      const response = await axios.post(`${API_URL}/auth/update-password`, {
        password
      });
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Password update failed');
      }
      throw error;
    }
  },

  /**
   * Check if the user is authenticated
   */
  isAuthenticated() {
    const token = localStorage.getItem('access_token');
    return !!token;
  },

  /**
   * Get the current auth token
   */
  getToken() {
    return localStorage.getItem('access_token');
  }
}; 