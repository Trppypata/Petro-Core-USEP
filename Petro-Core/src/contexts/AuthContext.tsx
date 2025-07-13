import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";

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
        // Try to get current user from token
        const currentUser = await authService.getCurrentUser();
        
        if (currentUser) {
          const userData: User = {
            id: currentUser.id,
            email: currentUser.email,
            name: currentUser.user_metadata?.first_name + ' ' + currentUser.user_metadata?.last_name,
            role: currentUser.user_metadata?.role || 'student'
          };
          
          setUser(userData);
        }
      } catch (error) {
        console.error("Error loading user:", error);
        // Clear any invalid auth data
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
      
      // Use authService to login
      const response = await authService.login({ email, password });
      
      if (response && response.user) {
        const userData: User = {
          id: response.user.id,
          email: response.user.email,
          name: response.user.user_metadata?.first_name + ' ' + response.user.user_metadata?.last_name,
          role: response.user.user_metadata?.role || 'student'
        };
        
        setUser(userData);
        
        // Log success message
        toast.success(`Welcome ${userData.name || userData.email}!`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to login");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      // Use authService to logout
      await authService.logout();
      setUser(null);
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error logging out");
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 