import PageLayout from "@/layouts/page.layout";
import HeroSection from "@/modules/home/hero/hero";
import AdminLayout from "@/layouts/admin.layout";
import DashboardPage from "@/modules/admin/dashboard/dashboard.page";
import LoginPage from "@/modules/auth/login.page";
import RegisterPage from "@/modules/auth/register.page";
import ProtectedRoute from "@/components/protected-route";
import { AdminGuard, StudentGuard } from "@/components/role-guard";
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import type { ReactNode } from "react";
import { GeologyPage } from "@/modules/admin/geology";
import UserPage from "@/modules/admin/users/users.page";
import UsersList from "@/modules/admin/users/user-list";
// Higher order component to wrap routes with role guards
const withRoleGuard = (Component: React.ComponentType, guard: React.FC<{children: ReactNode}>) => {
  const GuardComponent = guard;
  return () => (
    <GuardComponent>
      <Component />
    </GuardComponent>
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    Component: PageLayout,
    children: [
      { 
        index: true,
        path: "/",
        Component: HeroSection,
      },
    ]
  },
  // Auth routes
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/register",
    Component: RegisterPage,
  },

  // Admin dashboard routes - only accessible by admins
  {
    path: '/dashboard-app',
    Component: AdminLayout,
    children: [ 
      {
        path: '',

        children: [
          {
            index: true,
            Component: DashboardPage,
          },
          // Admin specific routes
          {
            path: 'users',
            Component: UserPage,
            children: [
              {
                index: true,
                Component: UsersList,
              },
              {
                path: 'users-list',
                Component: UsersList,
              },
            ],
          },
          {
            path: 'geology',
            Component: GeologyPage,
          },

          {
            path: 'settings',
            Component: () => <div>Admin Settings</div>,
          },
        ]
      }
    ]
  }
]);

export default router;