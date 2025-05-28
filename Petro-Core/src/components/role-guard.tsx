import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '@/services/auth.service';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallback?: React.ReactNode;
}

export function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const user = await authService.getCurrentUser();
        
        if (!user) {
          setHasAccess(false);
          setLoading(false);
          return;
        }
        
        const userRole = user.user_metadata?.role;
        if (userRole && allowedRoles.includes(userRole)) {
          setHasAccess(true);
        } else {
          setHasAccess(false);
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkUserRole();
  }, [allowedRoles]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!hasAccess) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <Navigate to="/dashboard-app" replace />
    );
  }
  
  return <>{children}</>;
}

// Common role guard shortcuts
export function AdminGuard({ children, fallback }: Omit<RoleGuardProps, 'allowedRoles'>) {
  return <RoleGuard allowedRoles={['admin']} fallback={fallback}>{children}</RoleGuard>;
}

export function StudentGuard({ children, fallback }: Omit<RoleGuardProps, 'allowedRoles'>) {
  return <RoleGuard allowedRoles={['student']} fallback={fallback}>{children}</RoleGuard>;
}

export function AdminOrStudentGuard({ children, fallback }: Omit<RoleGuardProps, 'allowedRoles'>) {
  return <RoleGuard allowedRoles={['admin', 'student']} fallback={fallback}>{children}</RoleGuard>;
} 