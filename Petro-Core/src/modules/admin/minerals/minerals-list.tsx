import { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search, Edit, Trash2, Eye } from 'lucide-react';
import { Spinner } from '@/components/spinner';
import type { IMineral, MineralCategory } from './mineral.interface';
import { useReadMinerals } from './hooks/useReadMinerals';
import { MineralContentForm, MineralEditForm, MineralDetailsView } from './components';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteMineral } from './hooks/useDeleteMineral';
import { toast } from 'sonner';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MineralsListProps {
  category: MineralCategory | string;
  searchTerm?: string;
  hideControls?: boolean;
}

const MineralsList = ({ 
  category,
  searchTerm: externalSearchTerm, 
  hideControls = false 
}: MineralsListProps) => {
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const [mineralToEdit, setMineralToEdit] = useState<IMineral | null>(null);
  const [mineralToDelete, setMineralToDelete] = useState<IMineral | null>(null);
  const [mineralToView, setMineralToView] = useState<IMineral | null>(null);
  const { mutateAsync: deleteMineralAsync, isPending: isDeleting } = useDeleteMineral();
  
  // Use external search term if provided, otherwise use internal
  const searchTerm = externalSearchTerm !== undefined ? externalSearchTerm : internalSearchTerm;
  
  // This will be implemented in the hooks folder
  const { data: minerals, isLoading, error, pagination, setPage, setPageSize, refetch } = useReadMinerals(category);
  
  // Enhanced debugging for minerals data
  useEffect(() => {
    console.log('MineralsList received data:', minerals);
    console.log('MineralsList category:', category);
    console.log('MineralsList error:', error);
    
    if (minerals && Array.isArray(minerals)) {
      console.log(`Found ${minerals.length} total minerals`);
      
      // Count minerals by category
      const categories = [...new Set(minerals.map(m => m.category))];
      console.log('Categories in data:', categories);
      
      const categoryCounts = categories.reduce((acc, cat) => {
        acc[cat] = minerals.filter(m => m.category === cat).length;
        return acc;
      }, {} as Record<string, number>);
      console.log('Minerals per category:', categoryCounts);
      
      // Check if we have minerals in the requested category
      const inRequestedCategory = minerals.filter(m => 
        m.category?.toLowerCase() === category?.toLowerCase()
      ).length;
      console.log(`Minerals in requested category "${category}": ${inRequestedCategory}`);
      
      // Log sample mineral data
      if (minerals.length > 0) {
        console.log('Sample mineral data:', minerals[0]);
      }
    } else {
      console.warn('No minerals data or data is not an array');
    }
  }, [minerals, category, error]);
  
  const filteredMinerals = minerals?.filter(mineral => {
    // If searching, filter by name or code
    if (searchTerm) {
      const nameMatch = mineral.mineral_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const codeMatch = mineral.mineral_code?.toLowerCase().includes(searchTerm.toLowerCase());
      return nameMatch || codeMatch;
    }
    
    // If not searching, return all minerals (ALL category) or just this category
    // Using case-insensitive comparison for more reliable matching
    return category === 'ALL' || 
           mineral.category?.toLowerCase() === category?.toLowerCase();
  }) || [];
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalSearchTerm(e.target.value);
  };

  const handleEdit = (mineral: IMineral) => {
    setMineralToEdit(mineral);
  };

  const handleCloseEdit = () => {
    setMineralToEdit(null);
    refetch();
  };

  const handleDelete = async () => {
    if (!mineralToDelete || !mineralToDelete.id) return;
    
    try {
      await deleteMineralAsync(mineralToDelete.id);
      toast.success(`${mineralToDelete.mineral_name} has been removed successfully.`);
      refetch();
    } catch (error) {
      console.error('Error deleting mineral:', error);
      toast.error("Failed to delete mineral. Please try again.");
    } finally {
      setMineralToDelete(null);
    }
  };

  const handleView = (mineral: IMineral) => {
    setMineralToView(mineral);
  };
  
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    const tableElement = document.getElementById('minerals-table');
    if (tableElement) {
      tableElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePageSizeChange = (value: string) => {
    const newPageSize = parseInt(value, 10);
    setPageSize(newPageSize);
    setPage(1);
  };
  
  const renderTableContent = () => {
    if (isLoading) {
      return (
        <TableRow>
          <TableCell colSpan={14} className="h-24 text-center">
            <Spinner className="mx-auto" />
            <span className="sr-only">Loading minerals...</span>
          </TableCell>
        </TableRow>
      );
    }
    
    if (error) {
      console.error('Error loading minerals:', error);
      return (
        <TableRow>
          <TableCell colSpan={14} className="h-24 text-center text-red-500">
            Error loading minerals: {error.message || 'Please try again later.'}
          </TableCell>
        </TableRow>
      );
    }
    
    if (!minerals) {
      console.warn('No minerals data received');
      return (
        <TableRow>
          <TableCell colSpan={14} className="h-24 text-center">
            No minerals data available.
          </TableCell>
        </TableRow>
      );
    }
    
    if (!Array.isArray(minerals)) {
      console.warn('Minerals data is not an array:', minerals);
      return (
        <TableRow>
          <TableCell colSpan={14} className="h-24 text-center">
            Invalid minerals data format.
          </TableCell>
        </TableRow>
      );
    }
    
    console.log('Rendering minerals:', filteredMinerals.length, 'of', minerals.length, 'items');
    
    if (filteredMinerals.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={14} className="h-24 text-center">
            No minerals found{category !== 'ALL' ? ` in ${category}` : ''}.
          </TableCell>
        </TableRow>
      );
    }
    
    return filteredMinerals.map((mineral: IMineral) => (
      <TableRow key={mineral.id || mineral.mineral_code}>
        <TableCell className="font-medium">{mineral.mineral_code}</TableCell>
        <TableCell>{mineral.mineral_name}</TableCell>
        <TableCell>{mineral.chemical_formula}</TableCell>
        <TableCell>{mineral.mineral_group}</TableCell>
        <TableCell>{mineral.color}</TableCell>
        <TableCell>{mineral.streak}</TableCell>
        <TableCell>{mineral.luster}</TableCell>
        <TableCell>{mineral.hardness}</TableCell>
        <TableCell>{mineral.cleavage}</TableCell>
        <TableCell>{mineral.fracture}</TableCell>
        <TableCell>{mineral.habit}</TableCell>
        <TableCell>{mineral.crystal_system}</TableCell>
        <TableCell>
          <div className="flex space-x-2">
            <Button
              variant="outline" 
              size="icon" 
              onClick={() => handleView(mineral)}
              title="View details"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => handleEdit(mineral)}
              title="Edit mineral"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setMineralToDelete(mineral)}
              title="Delete mineral"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <div>
      {!hideControls && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0 mb-4">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Search minerals..." 
              value={internalSearchTerm}
              onChange={handleSearchChange}
              className="w-64"
            />
          </div>
          <MineralContentForm category={category as MineralCategory} />
        </div>
      )}
      
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table id="minerals-table">
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Chemical Formula</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Streak</TableHead>
                <TableHead>Luster</TableHead>
                <TableHead>Hardness</TableHead>
                <TableHead>Cleavage</TableHead>
                <TableHead>Fracture</TableHead>
                <TableHead>Habit</TableHead>
                <TableHead>Crystal System</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderTableContent()}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {pagination && (
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            <p className="text-sm text-muted-foreground">
              Showing page {pagination.page} of {pagination.totalPages || 1} ({pagination.total} total items)
            </p>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Items per page:</span>
              <Select 
                value={pagination.pageSize.toString()} 
                onValueChange={handlePageSizeChange}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, pagination.totalPages || 1) }).map((_, i) => {
                // Logic to show pages around the current page
                let pageNum = pagination.page;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else {
                  // Show 2 pages before and after current page when possible
                  const start = Math.max(1, pagination.page - 2);
                  const end = Math.min(pagination.totalPages, start + 4);
                  pageNum = start + i;
                  
                  // Adjust if we're at the end
                  if (pageNum > pagination.totalPages) return null;
                }
                
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => handlePageChange(pageNum)}
                      isActive={pageNum === pagination.page}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              {(pagination.totalPages > 5 && pagination.page < pagination.totalPages - 2) && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              
              {pagination.totalPages > 5 && pagination.page < pagination.totalPages - 1 && (
                <PaginationItem>
                  <PaginationLink
                    onClick={() => handlePageChange(pagination.totalPages)}
                  >
                    {pagination.totalPages}
                  </PaginationLink>
                </PaginationItem>
              )}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= (pagination.totalPages || 1)}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
      
      {/* Mineral Edit Form */}
      {mineralToEdit && (
        <MineralEditForm 
          mineral={mineralToEdit} 
          onClose={handleCloseEdit}
          category={category as MineralCategory}
        />
      )}
      
      {/* Mineral Details View */}
      {mineralToView && (
        <MineralDetailsView
          mineral={mineralToView}
          onClose={() => setMineralToView(null)}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!mineralToDelete} onOpenChange={(open) => !open && setMineralToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the mineral <strong>{mineralToDelete?.mineral_name}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Spinner className="mr-2 h-4 w-4" /> : null}
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MineralsList; 