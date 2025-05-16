import { Menu, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, Input } from "./ui";

const SiteNavbar = () => {
  return (
    <nav className="fixed top-10 left-1/2 transform -translate-x-1/2 z-auto w-[80%] max-w-7xl bg-gray-100 backdrop-blur-md shadow-lg rounded-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex gap-8">
            <Link to="/" className="text-sm font-medium">
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
            <div className="relative">
              <Input
                type="search"
                placeholder="Search"
                className="w-[200px] lg:w-[300px] rounded-full bg-white"
              />
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
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
