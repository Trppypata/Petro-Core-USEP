import axios from 'axios';

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Store the JWT token in localStorage
const JWT_TOKEN = import.meta.env.VITE_JWT_TOKEN || 'YilC18qoKrKaWJBxdoBslfHFflvjHgI7n6EQH2cdeUYO0t1wmM/QjchQxh1TaYG+IuPcPQ4liG0JlhbY1DTL1A==';
localStorage.setItem('access_token', JWT_TOKEN);

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
   * Login with email and password
   */
  async login({ email, password }: AuthCredentials) {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      if (response.data.success && response.data.data.user) {
        // Save user info to localStorage for easy access
        localStorage.setItem('first_name', response.data.data.user.user_metadata?.first_name || '');
        localStorage.setItem('email', response.data.data.user.email || '');
        
        // Save user role
        localStorage.setItem('role', response.data.data.user.user_metadata?.role || 'student');
        
        // Save token
        localStorage.setItem('access_token', response.data.data.session.access_token);
      }
      
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Login failed');
      }
      throw error;
    }
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
        endpoint: `${API_URL}/auth/register`
      });
      
      const response = await axios.post(`${API_URL}/auth/register`, {
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
   * Logout the current user
   */
  async logout() {
    try {
      await axios.post(`${API_URL}/auth/logout`);
      
      // Clear localStorage
      localStorage.removeItem('first_name');
      localStorage.removeItem('email');
      localStorage.removeItem('role');
      localStorage.removeItem('access_token');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Logout failed');
      }
      throw error;
    }
  },

  /**
   * Get the current logged in user
   */
  async getCurrentUser() {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        return null;
      }
      
      const response = await axios.post(`${API_URL}/auth/current-user`, {
        token
      });
      
      return response.data.data.user;
    } catch (error) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('first_name');
      localStorage.removeItem('email');
      
      return null;
    }
  },

  /**
   * Send password reset email
   */
  async resetPassword(email: string) {
    try {
      const response = await axios.post(`${API_URL}/auth/reset-password`, {
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
}; 