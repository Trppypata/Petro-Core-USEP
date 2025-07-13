import axios from 'axios';

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
   * Login with email and password - OPTIMIZED
   */
  async login({ email, password }: AuthCredentials) {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,  
        password,
      }, {
        timeout: 5000 // Add explicit timeout
      });

      if (response.data.success) {
        // Batch localStorage operations
        const userData = response.data.data.user;
        const sessionData = response.data.data.session;
        
        // Use a single operation to set multiple items
        const storageData = {
          'first_name': userData.user_metadata?.first_name || '',
          'email': userData.email || '',
          'role': userData.user_metadata?.role || 'student',
          'access_token': sessionData.access_token
        };
        
        Object.entries(storageData).forEach(([key, value]) => {
          localStorage.setItem(key, value);
        });
        
        console.log('Login successful - data saved to localStorage');
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
   * Logout the current user
   */
  async logout() {
    try {
      await axios.post(`${API_URL}/api/auth/logout`);
      
      // Clear localStorage
      localStorage.removeItem('first_name');
      localStorage.removeItem('email');
      localStorage.removeItem('role');
      localStorage.removeItem('access_token');
      
      // Return to login page
      window.location.href = '/login';
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
      
      const response = await axios.post(`${API_URL}/api/auth/current-user`, {
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