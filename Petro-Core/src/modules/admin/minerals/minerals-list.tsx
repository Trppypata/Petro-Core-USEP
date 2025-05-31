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
import { MineralContentForm, MineralEditForm } from './components';
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
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
              className="text-destructive hover:text-destructive"
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
    <>
      {!hideControls && (
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search minerals..."
              value={internalSearchTerm}
              onChange={handleSearchChange}
              className="w-64"
            />
          </div>
          <MineralContentForm category={category as MineralCategory} onSuccess={() => refetch()} />
        </div>
      )}
      
      <div className="rounded-md border">
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

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-gray-500">
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total minerals)
          </p>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Rows per page:</span>
            <Select
              value={pagination.pageSize.toString()}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pagination.pageSize.toString()} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => pagination.page > 1 && handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            size="sm"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => pagination.page < pagination.totalPages && handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            size="sm"
          >
            Next
          </Button>
        </div>
      </div>

      {/* Edit Mineral Dialog */}
      {mineralToEdit && (
        <MineralEditForm 
          mineral={mineralToEdit} 
          onClose={handleCloseEdit}
          category={category as MineralCategory}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!mineralToDelete} onOpenChange={(open) => !open && setMineralToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the mineral{' '}
              <span className="font-semibold">{mineralToDelete?.mineral_name}</span>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Spinner className="mr-2 h-4 w-4" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Mineral Dialog */}
      <Sheet open={!!mineralToView} onOpenChange={(open) => !open && setMineralToView(null)}>
        <SheetContent className="p-0 flex flex-col h-full md:max-w-[40rem]">
          <SheetHeader className="py-4 bg-overlay-bg border-b border-overlay-border px-6 flex-shrink-0">
            <SheetTitle>{mineralToView?.mineral_name}</SheetTitle>
            <p className="text-xs text-muted-foreground">
              {mineralToView?.category} | Code: {mineralToView?.mineral_code}
            </p>
          </SheetHeader>
          
          <div className="flex-grow overflow-y-auto p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Code</p>
                <p className="text-sm">{mineralToView?.mineral_code}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Chemical Formula</p>
                <p className="text-sm">{mineralToView?.chemical_formula || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Group</p>
                <p className="text-sm">{mineralToView?.mineral_group}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Category</p>
                <p className="text-sm">{mineralToView?.category}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Color</p>
                <p className="text-sm">{mineralToView?.color || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Streak</p>
                <p className="text-sm">{mineralToView?.streak || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Luster</p>
                <p className="text-sm">{mineralToView?.luster || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Hardness</p>
                <p className="text-sm">{mineralToView?.hardness || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Cleavage</p>
                <p className="text-sm">{mineralToView?.cleavage || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Fracture</p>
                <p className="text-sm">{mineralToView?.fracture || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Habit</p>
                <p className="text-sm">{mineralToView?.habit || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Crystal System</p>
                <p className="text-sm">{mineralToView?.crystal_system || 'N/A'}</p>
              </div>
            </div>
          </div>
          
          <SheetFooter className="flex-shrink-0 px-6 py-4 bg-overlay-bg border-t border-overlay-border">
            <Button variant="outline" onClick={() => setMineralToView(null)} type="button">
              Close
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default MineralsList; 