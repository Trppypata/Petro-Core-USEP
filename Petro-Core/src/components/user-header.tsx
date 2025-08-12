import type { ReactNode } from "react";
import { Home } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger } from "./ui/dropdown-menu";

const UserHeader = ({ headerName }: { headerName?: ReactNode | string }) => {
  return (
    <>
      {/* {pathname.includes("admin-dashboard") && <TopNav links={topNav} />} */}

      {/* {!pathname.includes("admin-dashboard") && (
        )} */}

      <p className="font-bold text-sm md:text-1xl">{headerName}</p>
      <div className="ml-auto flex items-center space-x-2 ">
        {/* Go to Home Button */}
        <Button
          asChild
          variant="outline"
          size="sm"
          className="hidden md:flex items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          <Link to="/home">
            <Home className="h-4 w-4" />
            <span>Go to Home</span>
          </Link>
        </Button>
        
        {/* Mobile version - just icon */}
        <Button
          asChild
          variant="outline"
          size="icon"
          className="md:hidden"
        >
          <Link to="/home">
            <Home className="h-4 w-4" />
            <span className="sr-only">Go to Home</span>
          </Link>
        </Button>
        
        {/* <div className="relative ml-auto flex-1 md:grow-0">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="w-full h-8 rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
            placeholder="Search..."
            type="search"
          />
        </div> */}
      </div>
    </>
  );
};

const UserNav = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/avatars/01.png" alt="@shadcn" />
            <AvatarFallback>SN</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">satnaing</p>
            <p className="text-xs leading-none text-muted-foreground">
              satnaingdev@gmail.com
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            Profile
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
        
          <DropdownMenuItem>
            Settings
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>New Team</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          Log out
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};


export { UserHeader, UserNav };
