import * as React from 'react';
import {
  
  Rocket,
  Map,
  Lightbulb,
  GalleryVerticalEnd,
  LayoutDashboardIcon,
  PersonStanding,
  Lock,
} from 'lucide-react';

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { TeamSwitcher } from '@/components/team-switcher';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import Cookies from 'js-cookie';
const capitalizeWords = (str: string) => {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = React.useState({
    name: 'User',
    email: 'example@gmail.com',
    avatar: '../assets/logos.png',
  });

  React.useEffect(() => {
    const firstName = capitalizeWords(
      localStorage.getItem('first_name') || 'User'
    );
    const email = localStorage.getItem('email') || 'example@gmail.com';
    const avatar = Cookies.get('profile_url') || '../assets/logos.png';

    setUser({ name: firstName, email, avatar });
  }, []);

  const data = {
    user,
    teams: [
      {
        name: 'PETRO-CORE',
        logo: GalleryVerticalEnd,
        plan: 'Enterprise',
      },
    ],
    navMain: [
      {
        title: 'Dashboard',
        url: '/dashboard-app',
        icon: LayoutDashboardIcon,
      },
      {
        title: 'Users',
        url: 'users',
        icon: PersonStanding

      },
      {
        title: 'Geology',
        url: 'geology',
        icon: Rocket,
      },

      {
        title: 'Field Work Files',
        url: 'field-work-files',
        icon: Map,
      },
      {
        title: 'Trivia',
        url: 'trivia',
        icon: Lightbulb,
      },
      {
        title: 'System Lockdown',
        url: 'lockdown',
        icon: Lock,
     
      },
    ],
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
