import React from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";
import { buttonVariants } from "../ui/button";



export interface NavLink {
  title: string;
  label?: string;
  href: string;
}

interface NavbarProps extends React.HTMLAttributes<HTMLDivElement> {
  links: NavLink[];
}

const Navbar: React.FC<NavbarProps> = () => {
  const links = [
    {
      title: 'Home',
      href: '/',
      //icon: <HomeIcon />,
      //label: 'Home'
    },
    {
      title: 'About',
      href: '/about',
      //icon: <AboutIcon />,
      //label: 'About'
    }
  ];

  return (
    <div
      className={cn(
        "fixed top-10 left-1/2 transform -translate-x-1/2 z-80 w-[80%] max-w-7xl bg-gra-100 backdrop-blur-md shadow-lg rounded-full"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between h-16">
            {/* Navigation Links */}
            <div className="flex items-center space-x-6">
              {links.map(({ title, href }) => (
                <NavLinkItem
                  key={href}
                  title={title}
                  href={href}
                  isActive={window.location.pathname === href}
                />
              ))}
            </div>

            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5 text-gray-400"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-4.35-4.35m0 0a7.5 7.5 0 111.4-1.4l4.35 4.35z"
                  />
                </svg>
              </div>
            </div>
          </nav>
      </div>
    </div>
  );
};

interface NavLinkItemProps extends NavLink {
  isActive: boolean;
}

const NavLinkItem: React.FC<NavLinkItemProps> = ({
  title,
  href,
  // icon,
  label,
  isActive,
}) => {
  return (

        <Link
          to={href}
          className={cn(
            buttonVariants({
              variant: isActive ? "secondary" : "ghost",
              size: "sm",
            }),
            "flex items-center space-x-2 text-[#000000]"
          )}
        >
          {/* {icon} */}
          <span className="text-xs">{title}</span>
          {label && (
            <span className="ml-2 bg-primary px-1 py-0.5 rounded text-[10px] text-black">
              {label}
            </span>
          )}
        </Link>
      
  );
};

export default Navbar;
