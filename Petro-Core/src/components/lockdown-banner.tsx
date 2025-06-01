import { Lock } from "lucide-react";
import { useLockdown } from "@/contexts/LockdownContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";

export function LockdownBanner() {
  const { isLocked } = useLockdown();
  const { user } = useAuth();
  const location = useLocation();
  
  // Only show for students, not for admins
  const isAdmin = user?.role === 'admin';
  
  // Don't show on the hero page or admin pages
  const shouldShow = isLocked && 
                     !isAdmin && 
                     location.pathname !== '/' && 
                     !location.pathname.startsWith('/dashboard-app');

  if (!shouldShow) return null;

  return (
    <div className="w-full bg-amber-500 text-white p-2 text-center flex items-center justify-center space-x-2 font-medium shadow-md">
      <Lock className="h-4 w-4" />
      <span>
        System is currently in lockdown mode. Some content is restricted.
      </span>
    </div>
  );
} 