import { Menu, Lock, LogOut, User, BookOpen, Settings } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useLockdown } from "@/contexts/LockdownContext";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "./ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import petroLogo from "@/assets/petro.png";
import { toast } from "sonner";
import Cookies from 'js-cookie';

const SiteNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isLocked } = useLockdown();
  const isAdmin = user?.role === 'admin';
  
  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out");
    }
  };
  
  return (
    <nav className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-5xl bg-primary rounded-full shadow-lg">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-4 md:gap-8">
            <Link to="/home" className="flex items-center">
              <img 
                src={petroLogo}
                alt="Petro Core Logo" 
                className="h-8 w-auto mr-2 rounded-full" 
              />
            </Link>
            
            {/* Desktop navigation links */}
            <div className="hidden md:flex md:items-center md:gap-6">
              <Link to="/home" className="text-sm font-medium text-primary-foreground hover:text-accent transition-colors">
                Home
              </Link>
              <Link to="/field-works" className="text-sm font-medium text-primary-foreground hover:text-accent transition-colors">
                Field Works
              </Link>
              <Link to="/rock-minerals" className="text-sm font-medium text-primary-foreground hover:text-accent transition-colors">
                Rock and Minerals
              </Link>
              <Link to="/about-us" className="text-sm font-medium text-primary-foreground hover:text-accent transition-colors">
                About Us
              </Link>
            </div>
          </div>
          
          <div className="flex items-center">
            {/* Lockdown indicator for admins */}
            {isAdmin && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to="/dashboard-app/lockdown">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`mr-2 text-primary-foreground hover:bg-primary/80 ${isLocked ? 'text-destructive' : 'text-green-500'}`}
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
            
            {/* User dropdown menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-primary-foreground hover:bg-primary/80"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {user ? (
                  <>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {/* Mobile navigation links */}
                    <div className="md:hidden">
                      <DropdownMenuItem asChild>
                        <Link to="/home">Home</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/field-works">Field Works</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/rock-minerals">Rock and Minerals</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/about-us">About Us</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </div>
                    
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/dashboard-app">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Admin Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuItem asChild>
                      <Link to="/profile">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuLabel>Menu</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {/* Mobile navigation links */}
                    <div className="md:hidden">
                      <DropdownMenuItem asChild>
                        <Link to="/home">Home</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/field-works">Field Works</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/rock-minerals">Rock and Minerals</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/about-us">About Us</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </div>
                    
                    <DropdownMenuItem asChild>
                      <Link to="/login">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log in</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default SiteNavbar; 