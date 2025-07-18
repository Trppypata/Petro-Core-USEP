import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { authService } from '@/services/auth.service';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

type User = {
  id: string;
  name?: string;
  email: string;
  role: 'admin' | 'student';
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === 'admin';

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        // Use Supabase to get current session/user
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          throw error;
        }
        const supaUser = data.session?.user;
        if (supaUser) {
          const userData: User = {
            id: supaUser.id,
            email: supaUser.email!,
            name: supaUser.user_metadata?.full_name || supaUser.email!,
            role: supaUser.user_metadata?.role || 'student',
          };
          setUser(userData);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        localStorage.removeItem('access_token');
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      // Use authService to login (now returns { user, session } or null)
      const response = await authService.login({ email, password });
      if (response && response.user) {
        const userData: User = {
          id: response.user.id,
          email: response.user.email,
          name: response.user.user_metadata?.full_name || response.user.email,
          role: response.user.user_metadata?.role || 'student',
        };
        setUser(userData);
        toast.success(`Welcome ${userData.name || userData.email}!`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to login');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      // Use Supabase to sign out
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error logging out');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
