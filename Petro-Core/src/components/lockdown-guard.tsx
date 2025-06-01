import { ReactNode, useEffect } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useLockdown } from '@/contexts/LockdownContext';
import { useAuth } from '@/contexts/AuthContext';

interface LockdownGuardProps {
  children: ReactNode;
}

export function LockdownGuard({ children }: LockdownGuardProps) {
  const { isLocked } = useLockdown();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if the user is an admin
  const isAdmin = user?.role === 'admin';

  // If system is locked and user is not an admin, redirect to the hero page
  useEffect(() => {
    if (isLocked && !isAdmin && !location.pathname.startsWith('/dashboard-app')) {
      // Only redirect if trying to access protected content
      if (
        location.pathname.includes('/rock-minerals') ||
        location.pathname.includes('/field-works')
      ) {
        navigate('/', { replace: true });
      }
    }
  }, [isLocked, isAdmin, navigate, location.pathname]);

  // For direct rendering in router
  if (isLocked && !isAdmin && 
      (location.pathname.includes('/rock-minerals') || 
       location.pathname.includes('/field-works'))) {
    return <Navigate to="/" replace />;
  }

  // If not locked or user is admin, render children
  return <>{children}</>;
} 