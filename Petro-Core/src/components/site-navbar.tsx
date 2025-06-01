import { Menu, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { useLockdown } from "@/contexts/LockdownContext";
import { useAuth } from "@/contexts/AuthContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import petroLogo from "@/assets/petro.jpg";

const SiteNavbar = () => {
  const { isLocked } = useLockdown();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  return (
    <nav className="fixed top-10 left-1/2 transform -translate-x-1/2 z-auto w-[80%] max-w-7xl bg-gray-100 backdrop-blur-md shadow-lg rounded-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/home" className="flex items-center">
              <img 
                src={petroLogo} 
                alt="Petro Core Logo" 
                className="h-8 w-auto mr-2" 
              />
              <span className="font-bold text-blue-900">PETRO CORE</span>
            </Link>
            <Link to="/home" className="text-sm font-medium">
              Home
            </Link>
            <Link to="/field-works" className="text-sm font-medium">
              Field Works
            </Link>
            <Link to="/rock-minerals" className="text-sm font-medium">
              Rock and Minerals
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {/* Lockdown indicator for admins */}
            {isAdmin && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to="/dashboard-app/lockdown">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`ml-2 ${isLocked ? 'text-red-500' : 'text-green-500'}`}
                      >
                        <Lock className="h-5 w-5" />
                        <span className="sr-only">Lockdown Status</span>
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isLocked ? 'System is locked down' : 'System is active'}</p>
                    <p className="text-xs text-muted-foreground">Click to manage lockdown</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            <Link to="/menu">
              <Button variant="ghost" size="icon" className="ml-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default SiteNavbar;
