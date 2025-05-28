import { Layout, LayoutBody, LayoutHeader } from '@/components/layouts';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserHeader } from '@/components/user-header';
import type { ReactNode } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';

const LayoutPage = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const { userid } = useParams();

  const capitalizeWords = (str: string) => {
    return str
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const firstName = capitalizeWords(
    localStorage.getItem('first_name') || 'User'
  );

  const identifierCrumb = (): string => {
    const lastRoute = pathname.split('/');
    const name = lastRoute[lastRoute.length - 1];

    let finalName = '';

    if (name === 'users') {
      finalName = 'All Users';
    } else if (name === 'add_form') {
      finalName = 'Create User';
    } else if (userid !== undefined) {
      finalName = 'Modify User';
    } else if (name === 'museums') {
      finalName = 'All Museums';
    } else if (name === 'add_museum') {
      finalName = 'Create Museum';
    } else if (name === 'pharmacy') {
      finalName = 'All Pharmacy';
    } else if (name === 'brand-name') {
      finalName = 'All Brands';
    } else if (name === 'settings') {
      finalName = 'All Brands';
    } else if (name === 'generic-name') {
      finalName = 'All Generics';
    } else if (name === 'overview' || name === 'detailed') {
      finalName = 'Insights, Metrics, and Summary';
    } else if (name === 'medicines') {
      finalName = 'All Medicines';
    } else if (name === 'geology') {
      finalName = 'Geological Database';
    }

    return finalName;
  };

  const secondaryCrumb = (): string => {
    const lastRoute = pathname.split('/');
    const name = lastRoute[2];

    let finalName = '';

    if (name === 'users') {
      finalName = 'Users';
    } else if (name === 'museums') {
      finalName = 'Museums';
    } else if (name === 'pharmacy') {
      finalName = 'Pharmacy';
    } else if (name === 'settings') {
      finalName = 'Settings';
    } else if (name === 'overview') {
      finalName = 'Overview';
    } else if (name === 'detailed') {
      finalName = 'Detailed';
    } else if (name === 'medicines') {
      finalName = 'Medicine';
    } else if (name === 'geology') {
      finalName = 'Geology';
    }

    return finalName;
  };

  return (
    <Layout>
      <LayoutHeader>
        <SidebarTrigger className="-ml-1" />
        <UserHeader
          headerName={
            <Breadcrumb className="hidden md:flex">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link
                      to={'/dashboard-app'}
                      className="font-light text-[#927B6B]"
                    >
                      Dashboard
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={'../users'} className="font-light text-[#927B6B]">
                      {secondaryCrumb()}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {identifierCrumb().length < 2 ? (
                  `Welcome , ${firstName}`
                ) : (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="text-[#492309]">
                        {identifierCrumb()}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          }
        />
      </LayoutHeader>
      <LayoutBody>{children}</LayoutBody>
    </Layout>
  );
};

export default LayoutPage;
