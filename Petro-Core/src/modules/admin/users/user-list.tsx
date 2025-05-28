import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, ImageOff } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

import type { IStudent } from './user.interface';

import { Spinner } from '@/components/spinner';
import { Badge } from '@/components/ui/badge';
import { useMemo, useState } from 'react';
import useReadStudents from './hooks/useReadStudents';
import UserContentForm from './user-content-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Assume these functions make API calls to your backend

type RoleColor = {
  [key in 'admin' | 'student' | 'technician']: string;
};

const roleColors: RoleColor = {
  admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  student:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  technician:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
};

type Status = 'active' | 'inactive' | 'suspended';

const statusVariant: Record<Status, string> = {
  active: 'success',
  inactive: 'destructive',
  suspended: 'secondary',
};

const RoleBadge = ({ role }: { role: string }) => {
  const color =
    role.toLowerCase() in roleColors
      ? roleColors[role.toLowerCase() as keyof RoleColor]
      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';

  return (
    <Badge className={`${color} capitalize`} variant="outline">
      {role}
    </Badge>
  );
};

const ITEMS_PER_PAGE = 5;

const DEFAULT_AVATAR =
  'https://grammedia-vids.s3.ap-southeast-2.amazonaws.com/boy.png';

// Add a local cache to prevent repeated failures
const IMAGE_CACHE: Record<string, boolean> = {};

const getImageUrl = (profileUrl: string | undefined | null): string => {
  if (!profileUrl) return DEFAULT_AVATAR;

  // Check if we have a cached failure for this URL
  if (IMAGE_CACHE[profileUrl] === false) {
    return DEFAULT_AVATAR;
  }

  try {
    // Detect and handle C:\fakepath\ issues (browser security for file inputs)
    if (profileUrl.includes('fakepath')) {
      console.warn('Browser security prevents loading local file paths:', profileUrl);
      return DEFAULT_AVATAR;
    }
    
    // If profileUrl is already a full URL (starts with http or https)
    if (profileUrl.startsWith('http://') || profileUrl.startsWith('https://')) {
      // Add image optimization parameters
      const url = new URL(profileUrl);
      if (url.hostname.includes('supabase.co') && !url.searchParams.has('width')) {
        url.searchParams.set('width', '150');
        url.searchParams.set('height', '150');
        url.searchParams.set('quality', '80');
        return url.toString();
      }
    return profileUrl;
  }

    // If it includes supabase.co but doesn't start with http
    if (profileUrl.includes('supabase.co')) {
      const fullUrl = profileUrl.startsWith('http') ? profileUrl : `https://${profileUrl}`;
      // Add optimization parameters
      const url = new URL(fullUrl);
      if (!url.searchParams.has('width')) {
        url.searchParams.set('width', '150');
        url.searchParams.set('height', '150');
        url.searchParams.set('quality', '80');
      }
      return url.toString();
    }

    // Check if it's a path from our own upload API
    if (profileUrl.startsWith('/uploads/') || profileUrl.startsWith('uploads/')) {
      const cleanPath = profileUrl.startsWith('/') ? profileUrl.substring(1) : profileUrl;
      return `${import.meta.env.VITE_local_url || 'http://localhost:8000'}/api/${cleanPath}`;
    }

    // If it's just a filename or path, assume it's in Supabase storage
    return `https://bqceruupeeortjtbmnmf.supabase.co/storage/v1/object/public/uploads/${profileUrl}?width=150&height=150&quality=80`;
  } catch (error) {
    console.error('Error parsing image URL:', error);
    return DEFAULT_AVATAR;
  }
};

// Add a component for profile image with loading state
const ProfileImage = ({ profileUrl }: { profileUrl: string | undefined | null }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imageUrl = getImageUrl(profileUrl);

  return (
    <div className="relative w-16 h-16 rounded-md overflow-hidden">
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800">
          <ImageOff className="w-6 h-6 text-gray-400" />
          <span className="text-xs text-gray-500 mt-1">No image</span>
        </div>
      )}

      <img
        alt="Student avatar"
        className={`aspect-square object-cover w-full h-full transition-opacity duration-300 ${isLoading || hasError ? 'opacity-0' : 'opacity-100'}`}
        src={imageUrl}
        onLoad={() => {
          setIsLoading(false);
          setHasError(false);
          if (profileUrl) IMAGE_CACHE[profileUrl] = true;
        }}
        onError={(e) => {
          console.warn('⚠️ Failed to load image:', profileUrl, 'Using default avatar instead');
          setIsLoading(false);
          setHasError(true);
          if (profileUrl) IMAGE_CACHE[profileUrl] = false;
          
          // If error is due to local file path, log specific message
          if (profileUrl && profileUrl.includes('fakepath')) {
            console.warn('Browser security prevents loading local file paths. Upload the image to a server instead.');
          }
          
          // Set a fallback but don't show it (we have our own error UI)
          const img = e.target as HTMLImageElement;
          img.style.display = 'none';
        }}
      />
    </div>
  );
};

const StudentsList = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const { data: userDetails, isLoading, error } = useReadStudents();

  console.log('🔍 UsersList received data:', userDetails);

  // Update search term and reset pagination
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const filteredUsers = useMemo(() => {
    if (!userDetails) {
      console.warn('⚠️ No user details received');
      return [];
    }

    if (!Array.isArray(userDetails)) {
      console.warn('⚠️ User details is not an array:', userDetails);
      return [];
    }

    console.log('✅ Processing users:', userDetails);

    const filtered = userDetails
      .filter((user: IStudent) => {
        if (!user.student_name && (!user.first_name || !user.last_name)) {
          console.warn('⚠️ User missing name:', user);
          return false;
        }
        const searchName = user.student_name || `${user.first_name} ${user.last_name}`;
        return searchName
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      });

    console.log('✅ Filtered users:', filtered);
    return filtered;
  }, [userDetails, searchTerm]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  }, [filteredUsers]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() =>
                currentPage > 1 && handlePageChange(currentPage - 1)
              }
              className={
                currentPage === 1
                  ? 'pointer-events-none opacity-50'
                  : 'cursor-pointer'
              }
            />
          </PaginationItem>

          {Array.from({ length: Math.min(totalPages, 3) }).map((_, index) => {
            let pageNum;

            if (totalPages <= 3) {
              pageNum = index + 1;
            } else if (currentPage <= 2) {
              pageNum = index + 1;
            } else if (currentPage >= totalPages - 1) {
              pageNum = totalPages - 2 + index;
            } else {
              pageNum = currentPage - 1 + index;
            }

            return (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  onClick={() => handlePageChange(pageNum)}
                  isActive={currentPage === pageNum}
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            );
          })}

          {totalPages > 3 && currentPage < totalPages - 2 && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          {totalPages > 3 && currentPage < totalPages - 1 && (
            <PaginationItem>
              <PaginationLink onClick={() => handlePageChange(totalPages)}>
                {totalPages}
              </PaginationLink>
            </PaginationItem>
          )}

          <PaginationItem>
            <PaginationNext
              onClick={() =>
                currentPage < totalPages && handlePageChange(currentPage + 1)
              }
              className={
                currentPage === totalPages
                  ? 'pointer-events-none opacity-50'
                  : 'cursor-pointer'
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  const renderTableContent = () => {
    if (isLoading) {
      return (
        <TableRow>
          <TableCell colSpan={9} className="h-[400px] text-center">
            <Spinner className="mx-auto" />
                          <span className="sr-only">Loading students...</span>
          </TableCell>
        </TableRow>
      );
    }

    if (error) {
      return (
        <TableRow>
          <TableCell colSpan={9} className="h-[400px] text-center text-red-500">
            Error loading students. Please try again later.
          </TableCell>
        </TableRow>
      );
    }

    if (filteredUsers.length === 0) {
      return (
        <TableRow>
          <TableCell
            colSpan={9}
            className="h-[400px] text-center text-md text-red"
          >
            No students found.
          </TableCell>
        </TableRow>
      );
    }

    return paginatedUsers.map((user: IStudent) => (
      <TableRow key={user.user_id}>
        <TableCell className="sm:table-cell">
          <div className="flex justify-center items-center">
            <ProfileImage profileUrl={user.profile_url} />
          </div>
        </TableCell>

        <TableCell className="font-light text-center">
          <span className="font-bold text-md">{user.first_name}</span>
        </TableCell>
        <TableCell className="font-light text-center">
          <span className="font-bold text-md">{user.middle_name || '-'}</span>
        </TableCell>
        <TableCell className="font-light text-center">
          <span className="font-bold text-md">{user.last_name}</span>
        </TableCell>
        <TableCell className="font-light text-center">
          <span className="font-bold text-md">{user.email}</span>
        </TableCell>
        <TableCell className="font-light text-center">
          <span className="text-md">{user.contact}</span>
        </TableCell>
        <TableCell className="font-light text-center">
          <span className="font-bold text-md">{user.address || '-'}</span>
        </TableCell>
        <TableCell className="font-light text-center">
          <span className="font-bold text-md capitalize">{user.position || 'student'}</span>
        </TableCell>
        <TableCell className="text-center">
          <Badge
            variant={
              (statusVariant[user.status as keyof typeof statusVariant] as
                | 'success'
                | 'destructive'
                | 'secondary'
                | 'default'
                | 'outline') || 'outline'
            }
          >
            {user.status}
          </Badge>
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <>
      <div className="flex items-center p-4">
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search students ..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-64"
            />
          </div>

          <UserContentForm />
        </div>
      </div>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <div className="flex flex-col">
              <CardTitle className="text-[#492309]">Students</CardTitle>
              <CardDescription>
                Manage your Students and view their profile.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Image</TableHead>
                <TableHead className="text-center">First Name</TableHead>
                <TableHead className="text-center">Middle Name</TableHead>
                <TableHead className="text-center">Last Name</TableHead>
                <TableHead className="text-center">Email</TableHead>
                <TableHead className="text-center">Contact</TableHead>
                <TableHead className="text-center">Address</TableHead>
                <TableHead className="text-center">Position</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{renderTableContent()}</TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6">
          <div className="text-sm text-muted-foreground w-1/4">
            Showing{' '}
            <strong>
              {filteredUsers.length > 0
                ? (currentPage - 1) * ITEMS_PER_PAGE + 1
                : 0}
              -{Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)}
            </strong>{' '}
            of <strong>{filteredUsers.length}</strong> Students
          </div>
          {renderPagination()}
        </CardFooter>
      </Card>
    </>
  );
};

export default StudentsList;
