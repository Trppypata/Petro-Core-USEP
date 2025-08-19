import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, ImageOff, Edit2, Edit } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import type { IStudent } from "./user.interface";

import { Spinner } from "@/components/spinner";
import { Badge } from "@/components/ui/badge";
import { useEffect, useMemo, useState } from "react";
import useReadStudents from "./hooks/useReadStudents";
import UserContentForm from "./user-content-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { getAccountDetails } from "../minerals/services/minerals.service";
import UpdateUserContentForm from "./update-user-content-form";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

// Assume these functions make API calls to your backend

const ITEMS_PER_PAGE = 5;

type RoleColor = {
  [key in "admin" | "student" | "technician"]: string;
};

const roleColors: RoleColor = {
  admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  student: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  technician: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

const statusVariant = {
  active: "success",
  inactive: "destructive",
  pending: "secondary",
  suspended: "destructive",
};

const ProfileImage = ({ profileUrl }: { profileUrl?: string }) => {
  const [imageError, setImageError] = useState(false);

  if (!profileUrl || imageError) {
    return (
      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
        <ImageOff className="w-5 h-5 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="w-10 h-10 rounded-full overflow-hidden">
      <img
        src={profileUrl}
        alt="Profile"
        className="w-full h-full object-cover"
        onError={(e) => {
          setImageError(true);
          const img = e.target as HTMLImageElement;
          img.style.display = "none";
        }}
      />
    </div>
  );
};

const StudentsList = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const { data: userDetails, isLoading, error } = useReadStudents();

  // Update search term and reset pagination
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleRefreshSession = async () => {
    try {
      setIsRefreshing(true);
      
      // First refresh the session
      await authService.refreshSession();
      
      // Then get the updated role from the database
      const updatedRole = await authService.getUpdatedUserRole();
      
      toast.success(`Session refreshed! Your role is now: ${updatedRole}`);
      
      // Re-fetch current user details
      const user = await getAccountDetails();
      setCurrentUser(user);
    } catch (error) {
      console.error("Failed to refresh session:", error);
      toast.error("Failed to refresh session. Please log out and log back in.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!userDetails) {
      console.warn("⚠️ No user details received");
      return [];
    }

    if (!Array.isArray(userDetails)) {
      console.warn("⚠️ User details is not an array:", userDetails);
      return [];
    }

    console.log("✅ Processing users:", userDetails);

    const filtered = userDetails.filter((user: IStudent) => {
      if (!user.student_name && (!user.first_name || !user.last_name)) {
        console.warn("⚠️ User missing name:", user);
        return false;
      }
      const searchName =
        user.student_name || `${user.first_name} ${user.last_name}`;
      return searchName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    console.log("✅ Filtered users:", filtered);
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

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => handlePageChange(i)}
            isActive={currentPage === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
          {pages}
          <PaginationItem>
            <PaginationNext
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
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
          <TableCell colSpan={9} className="text-center py-8">
            <Spinner />
          </TableCell>
        </TableRow>
      );
    }

    if (error) {
      return (
        <TableRow>
          <TableCell colSpan={9} className="text-center py-8 text-red-500">
            Error loading students: {error.message}
          </TableCell>
        </TableRow>
      );
    }

    if (paginatedUsers.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={9} className="text-center py-8 text-gray-500">
            No students found
          </TableCell>
        </TableRow>
      );
    }

    return paginatedUsers.map((user: IStudent) => (
      <TableRow key={user.id || user.user_id}>
        <TableCell className="sm:table-cell">
          <div className="flex justify-center items-center">
            <ProfileImage profileUrl={user.profile_url} />
          </div>
        </TableCell>

        <TableCell className="font-light text-center">
          <span className="font-bold text-md">{user.first_name}</span>
        </TableCell>
        <TableCell className="font-light text-center">
          <span className="font-bold text-md">{user.middle_name || "-"}</span>
        </TableCell>
        <TableCell className="font-light text-center">
          <span className="font-bold text-md">{user.last_name}</span>
        </TableCell>
        <TableCell className="font-light text-center">
          <span className="font-bold text-md">{user.email}</span>
        </TableCell>
        <TableCell className="font-light text-center">
          <span className="font-bold text-md">{user.address || "-"}</span>
        </TableCell>
        <TableCell className="font-light text-center">
          <span className="font-bold text-md capitalize">
            {user.position || "student"}
          </span>
        </TableCell>
        <TableCell className="text-center">
          <Badge
            variant={
              (statusVariant[user.status as keyof typeof statusVariant] as
                | "success"
                | "destructive"
                | "secondary"
                | "default"
                | "outline") || "outline"
            }
          >
            {user.status}
          </Badge>
        </TableCell>
        <TableCell className="text-center">
          <UpdateUserContentForm userID={user.id} />
        </TableCell>
      </TableRow>
    ));
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await getAccountDetails();
        setCurrentUser(user);
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };

    fetchCurrentUser();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Students</CardTitle>
        <CardDescription>
          Manage your Students and view their profile. 
          <span className="text-amber-600 font-medium">
            {" "}💡 Tip: After changing a user's role, they need to log out and log back in, or use the "Refresh Session" button.
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-64"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshSession}
              disabled={isRefreshing}
              className="h-8"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap ml-1">
                Refresh Session
              </span>
            </Button>
            <UserContentForm />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Image</TableHead>
                <TableHead className="text-center">First Name</TableHead>
                <TableHead className="text-center">Middle Name</TableHead>
                <TableHead className="text-center">Last Name</TableHead>
                <TableHead className="text-center">Email</TableHead>
                <TableHead className="text-center">Address</TableHead>
                <TableHead className="text-center">Position</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{renderTableContent()}</TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex items-center justify-between w-full">
          <div className="text-sm text-gray-500">
            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to{" "}
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} of{" "}
            {filteredUsers.length} Students
          </div>
          {renderPagination()}
        </div>
      </CardFooter>
    </Card>
  );
};

export default StudentsList;
