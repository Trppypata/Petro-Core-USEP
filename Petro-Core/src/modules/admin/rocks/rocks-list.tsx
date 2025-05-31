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
import { Search, Image as ImageIcon, Edit, Trash2, Eye, PlusCircleIcon } from 'lucide-react';
import { Spinner } from '@/components/spinner';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { IRock, RockCategory } from './rock.interface';
import { useReadRocks } from './hooks/useReadRocks';
import RockContentForm from './components/rock-content-form';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDeleteRock } from './hooks/useDeleteRock';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import RockEditForm from './components/rock-edit-form';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";

interface RocksListProps {
  category: RockCategory | string;
  searchTerm?: string;
  hideControls?: boolean;
}

const RocksList = ({ 
  category,
  searchTerm: externalSearchTerm, 
  hideControls = false 
}: RocksListProps) => {
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const [selectedRock, setSelectedRock] = useState<IRock | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [rockToEdit, setRockToEdit] = useState<IRock | null>(null);
  const [rockToDelete, setRockToDelete] = useState<IRock | null>(null);
  const [rockToView, setRockToView] = useState<IRock | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  // Use external search term if provided, otherwise use internal
  const searchTerm = externalSearchTerm !== undefined ? externalSearchTerm : internalSearchTerm;
  
  // This will be implemented in the hooks folder
  const { 
    data: rocks, 
    isLoading, 
    error, 
    pagination, 
    setPage, 
    setPageSize 
  } = useReadRocks(category);
  
  const { mutateAsync: deleteRockAsync, isDeleting } = useDeleteRock();
  
  // Debug logs to help diagnose issues
  useEffect(() => {
    if (rocks && rocks.length > 0) {
      // Log all categories present in the data
      const categories = [...new Set(rocks.map(rock => rock.category))];
      console.log('Rock categories found in data:', categories);
      
      // Count items per category
      const categoryCounts = categories.reduce((acc, cat) => {
        acc[cat] = rocks.filter(rock => rock.category === cat).length;
        return acc;
      }, {} as Record<string, number>);
      console.log('Rocks per category:', categoryCounts);
      
      // Check if we have Ore Samples
      const oreSamples = rocks.filter(rock => rock.category === 'Ore Samples');
      console.log('Ore Samples count:', oreSamples.length);
      if (oreSamples.length > 0) {
        console.log('Sample Ore Sample:', oreSamples[0]);
      }
      
      // Check coordinates data
      const withCoordinates = rocks.filter(rock => rock.coordinates).length;
      const withLatLong = rocks.filter(rock => rock.latitude && rock.longitude).length;
      console.log('Rocks with coordinates field:', withCoordinates);
      console.log('Rocks with latitude & longitude:', withLatLong);
      
      // If current category is Ore Samples, log all data
      if (category === 'Ore Samples') {
        console.log('All Ore Samples:', rocks.filter(rock => rock.category === 'Ore Samples'));
      }
    }
  }, [rocks, category]);
  
  const filteredRocks = rocks?.filter(rock => 
    rock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (rock.type && rock.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (rock.depositional_environment && rock.depositional_environment.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (rock.color && rock.color.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (rock.texture && rock.texture.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (rock.locality && rock.locality.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (rock.mineral_composition && rock.mineral_composition.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (rock.rock_code && rock.rock_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (rock.commodity_type && rock.commodity_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (rock.ore_group && rock.ore_group.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (rock.mining_company && rock.mining_company.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalSearchTerm(e.target.value);
  };
  
  const handleRockSelect = (rock: IRock) => {
    setSelectedRock(rock);
  };
  
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    // Scroll to top of the table when changing page
    const tableElement = document.getElementById('rocks-table');
    if (tableElement) {
      tableElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePageSizeChange = (value: string) => {
    const newPageSize = parseInt(value, 10);
    setPageSize(newPageSize);
    // Reset to first page when changing page size
    setPage(1);
  };
  
  const handleEdit = (rock: IRock) => setRockToEdit(rock);
  const handleCloseEdit = () => setRockToEdit(null);
  const handleDelete = async () => {
    if (!rockToDelete || !rockToDelete.id) return;
    try {
      await deleteRockAsync(rockToDelete.id);
      setRockToDelete(null);
    } catch (error) {
      setRockToDelete(null);
    }
  };
  const handleView = (rock: IRock) => setRockToView(rock);
  
  const handleAddSuccess = () => {
    setIsAddOpen(false);
    // Refetch rocks after adding
    if (typeof window !== 'undefined') {
      window.location.reload(); // fallback if no refetch method
    }
  };
  
  const renderTableContent = () => {
    if (isLoading) {
      return (
        <TableRow>
          <TableCell colSpan={15} className="h-24 text-center">
            <Spinner className="mx-auto" />
            <span className="sr-only">Loading rocks...</span>
          </TableCell>
        </TableRow>
      );
    }
    
    if (error) {
      return (
        <TableRow>
          <TableCell colSpan={15} className="h-24 text-center text-red-500">
            Error loading rocks. Please try again later.
          </TableCell>
        </TableRow>
      );
    }
    
    if (!filteredRocks || filteredRocks.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={15} className="h-24 text-center">
            No rocks found in {category} category.
          </TableCell>
        </TableRow>
      );
    }
    
    // Process rocks to ensure no duplicates and clean up rock codes
    const processedRocks = filteredRocks
      // Remove any duplicate rock_codes (keep the most recently updated one)
      .reduce((unique: IRock[], rock) => {
        // Clean up rock code - replace spaces
        if (rock.rock_code && rock.rock_code.includes(' ')) {
          rock.rock_code = rock.rock_code.replace(/\s+/g, '');
        }
        
        // Find existing rock with the same code
        const existingIndex = unique.findIndex((r: IRock) => 
          r.rock_code && rock.rock_code && 
          r.rock_code.replace(/\s+/g, '') === rock.rock_code.replace(/\s+/g, '')
        );
        
        if (existingIndex >= 0) {
          // If we found a duplicate, keep the one with the most recent updated_at
          const existing = unique[existingIndex];
          if (rock.updated_at && existing.updated_at && new Date(rock.updated_at) > new Date(existing.updated_at)) {
            unique[existingIndex] = rock;
          }
        } else {
          unique.push(rock);
        }
        
        return unique;
      }, []);
    
    return processedRocks.map((rock: IRock) => (
      <TableRow key={rock.id || rock.name} className="cursor-pointer hover:bg-gray-50" onClick={() => handleRockSelect(rock)}>
        {rock.image_url ? (
          <TableCell>
            <div className="w-10 h-10 relative">
              <img 
                src={rock.image_url} 
                alt={rock.name}
                className="w-10 h-10 object-cover rounded-md"
                onError={(e) => {
                  console.error('Image failed to load:', rock.image_url);
                  // Replace with fallback image icon
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement?.classList.add('bg-gray-200', 'flex', 'items-center', 'justify-center');
                  // Create and append fallback icon
                  const icon = document.createElement('div');
                  icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image text-gray-500"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                  e.currentTarget.parentElement?.appendChild(icon);
                }}
              />
            </div>
          </TableCell>
        ) : (
          <TableCell>
            <div className="w-10 h-10 bg-gray-200 rounded-md flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-gray-500" />
            </div>
          </TableCell>
        )}
        <TableCell className="font-medium break-words">{rock.name}</TableCell>
        <TableCell className="break-words">{rock.rock_code ? rock.rock_code.replace(/\s+/g, '') : '-'}</TableCell>
        
        {/* Only show Category column when not in Ore Samples view */}
        {category !== 'Ore Samples' && (
          <TableCell>
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              {rock.category}
            </Badge>
          </TableCell>
        )}
        
        <TableCell className="break-words">{rock.type || '-'}</TableCell>
        
        {/* Ore Samples specific fields */}
        {category === 'Ore Samples' && (
          <>
            <TableCell className="break-words">{rock.commodity_type || '-'}</TableCell>
            <TableCell className="break-words">{rock.ore_group || '-'}</TableCell>
            <TableCell className="break-words">{rock.mining_company || '-'}</TableCell>
          </>
        )}
        
        <TableCell className="break-words">{rock.chemical_formula || '-'}</TableCell>
        <TableCell className="break-words">{rock.color || '-'}</TableCell>
        <TableCell className="break-words">{rock.hardness || '-'}</TableCell>
        
        {/* Only show texture and grain size for non-ore samples */}
        {category !== 'Ore Samples' && (
          <>
            <TableCell className="break-words">{rock.texture || '-'}</TableCell>
            <TableCell className="break-words">{rock.grain_size || '-'}</TableCell>
          </>
        )}
        
        {/* Igneous-specific fields */}
        {category === 'Igneous' && (
          <>
            <TableCell className="break-words">{rock.silica_content || '-'}</TableCell>
            <TableCell className="break-words">{rock.cooling_rate || '-'}</TableCell>
            <TableCell className="break-words">{rock.mineral_content || '-'}</TableCell>
          </>
        )}
        
        {/* Sedimentary-specific fields */}
        {category === 'Sedimentary' && (
          <>
            <TableCell className="break-words">{rock.bedding || '-'}</TableCell>
            <TableCell className="break-words">{rock.sorting || '-'}</TableCell>
            <TableCell className="break-words">{rock.roundness || '-'}</TableCell>
            <TableCell className="break-words">{rock.fossil_content || '-'}</TableCell>
            <TableCell className="break-words">{rock.sediment_source || '-'}</TableCell>
          </>
        )}
        
        {/* Metamorphic-specific fields */}
        {category === 'Metamorphic' && (
          <>
            <TableCell className="break-words">{rock.metamorphism_type || '-'}</TableCell>
            <TableCell className="break-words">{rock.metamorphic_grade || '-'}</TableCell>
            <TableCell className="break-words">{rock.parent_rock || '-'}</TableCell>
            <TableCell className="break-words">{rock.foliation || '-'}</TableCell>
          </>
        )}
        
        {/* Show Associated Minerals for all rock types */}
        <TableCell className="break-words">{rock.associated_minerals || '-'}</TableCell>
        
        {/* Conditionally show different environment label for ore samples */}
        {category === 'Ore Samples' ? (
          <TableCell className="break-words">{rock.description || '-'}</TableCell>
        ) : (
          <TableCell className="break-words">{rock.depositional_environment || '-'}</TableCell>
        )}
        
        <TableCell className="break-words">{rock.locality || '-'}</TableCell>
        
        {/* Only show geological age and formation for non-ore samples */}
        {category !== 'Ore Samples' && (
          <>
            <TableCell className="break-words">{rock.geological_age || '-'}</TableCell>
            <TableCell className="break-words">{rock.formation || '-'}</TableCell>
          </>
        )}
        
        {/* Show coordinates for all rock types */}
        <TableCell className="break-words">
          {rock.coordinates || 
           (rock.latitude && rock.longitude ? 
            `${rock.latitude}, ${rock.longitude}` : 
            '-')}
        </TableCell>
        
        <TableCell>
          <Badge variant={rock.status === 'active' ? 'success' : 'destructive'}>
            {rock.status || 'inactive'}
          </Badge>
        </TableCell>
        
        {/* New fields */}
        <TableCell>{rock.reaction_to_hcl || '-'}</TableCell>
        {category === 'Metamorphic' && <TableCell>{rock.foliation_type || '-'}</TableCell>}
        {category === 'Igneous' && <TableCell>{rock.origin || '-'}</TableCell>}
        <TableCell>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={e => { e.stopPropagation(); handleView(rock); }}
              title="View details"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={e => { e.stopPropagation(); handleEdit(rock); }}
              title="Edit rock"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={e => { e.stopPropagation(); setRockToDelete(rock); }}
              className="text-destructive hover:text-destructive"
              title="Delete rock"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    ));
  };
  
  return (
    <div className="space-y-4">
      {!hideControls && (
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search rocks by name, type, color..."
              className="pl-8"
              value={internalSearchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <Button className="h-8 gap-1" size="sm" variant="default" onClick={() => setIsAddOpen(true)}>
            <PlusCircleIcon className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Rock</span>
          </Button>
        </div>
      )}
      
      <div className="rounded-md border">
        <Table id="rocks-table">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              
              {/* Only show Category column when not in Ore Samples view */}
              {category !== 'Ore Samples' && <TableHead>Category</TableHead>}
              
              <TableHead>Type</TableHead>
              
              {/* Ore Samples specific fields */}
              {category === 'Ore Samples' && (
                <>
                  <TableHead>Commodity Type</TableHead>
                  <TableHead>Ore Group</TableHead>
                  <TableHead>Mining Company</TableHead>
                </>
              )}
              
              <TableHead>Chemical Formula</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Hardness</TableHead>
              
              {/* Only show texture and grain size for non-ore samples */}
              {category !== 'Ore Samples' && (
                <>
                  <TableHead>Texture</TableHead>
                  <TableHead>Grain Size</TableHead>
                </>
              )}
              
              {/* Igneous-specific fields */}
              {category === 'Igneous' && (
                <>
                  <TableHead>Silica Content</TableHead>
                  <TableHead>Cooling Rate</TableHead>
                  <TableHead>Mineral Content</TableHead>
                </>
              )}
              
              {/* Sedimentary-specific fields */}
              {category === 'Sedimentary' && (
                <>
                  <TableHead>Bedding</TableHead>
                  <TableHead>Sorting</TableHead>
                  <TableHead>Roundness</TableHead>
                  <TableHead>Fossil Content</TableHead>
                  <TableHead>Sediment Source</TableHead>
                </>
              )}
              
              {/* Metamorphic-specific fields */}
              {category === 'Metamorphic' && (
                <>
                  <TableHead>Metamorphism Type</TableHead>
                  <TableHead>Metamorphic Grade</TableHead>
                  <TableHead>Parent Rock</TableHead>
                  <TableHead>Foliation</TableHead>
                </>
              )}
              
              {/* Show Associated Minerals for all rock types */}
              <TableHead>Associated Minerals</TableHead>
              
              {/* Conditionally show different environment label for ore samples */}
              {category === 'Ore Samples' ? (
                <TableHead>Description</TableHead>
              ) : (
                <TableHead>Depositional Environment</TableHead>
              )}
              
              <TableHead>Locality</TableHead>
              
              {/* Only show geological age and formation for non-ore samples */}
              {category !== 'Ore Samples' && (
                <>
                  <TableHead>Geological Age</TableHead>
                  <TableHead>Formation</TableHead>
                </>
              )}
              
              {/* Show coordinates for all rock types */}
              <TableHead>Coordinates</TableHead>
              <TableHead>Status</TableHead>
              
              {/* Additional fields */}
              <TableHead>Reaction to HCl</TableHead>
              {category === 'Metamorphic' && <TableHead>Foliation Type</TableHead>}
              {category === 'Igneous' && <TableHead>Origin</TableHead>}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {renderTableContent()}
          </TableBody>
        </Table>
      </div>
      
      {/* Simplified Pagination UI */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-gray-500">
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total rocks)
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
      
      {/* Edit Rock Dialog */}
      {rockToEdit && (
        <RockEditForm 
          rock={rockToEdit}
          onClose={handleCloseEdit}
          category={category as RockCategory}
        />
      )}
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!rockToDelete} onOpenChange={open => !open && setRockToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the rock{' '}
              <span className="font-semibold">{rockToDelete?.name}</span>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Spinner className="mr-2 h-4 w-4" />}Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* View Rock Dialog */}
      <Sheet open={!!rockToView} onOpenChange={open => !open && setRockToView(null)}>
        <SheetContent className="p-0 flex flex-col h-full md:max-w-[40rem]">
          <SheetHeader className="py-4 bg-overlay-bg border-b border-overlay-border px-6 flex-shrink-0">
            <SheetTitle>{rockToView?.name}</SheetTitle>
            <p className="text-xs text-muted-foreground">
              {rockToView?.category} | Code: {rockToView?.rock_code}
            </p>
          </SheetHeader>
          
          <div className="flex-grow overflow-y-auto p-6">
            <RockContentForm 
              rock={rockToView!} 
              readOnly 
              inSheet={true}
              onClose={() => setRockToView(null)}
            />
          </div>
          
          <SheetFooter className="flex-shrink-0 px-6 py-4 bg-overlay-bg border-t border-overlay-border">
            <Button variant="outline" onClick={() => setRockToView(null)} type="button">
              Close
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      {/* Add Rock Dialog */}
      <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
        <SheetContent className="p-0 flex flex-col h-full md:max-w-[40rem]">
          <SheetHeader className="py-4 bg-overlay-bg border-b border-overlay-border px-6 flex-shrink-0">
            <SheetTitle>Add New Rock</SheetTitle>
            <p className="text-xs text-muted-foreground">
              Fill in the details to add a new rock.
            </p>
          </SheetHeader>
          
          <div className="flex-grow overflow-y-auto">
            <RockContentForm 
              category={category as RockCategory} 
              onClose={handleAddSuccess} 
              inSheet={true}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default RocksList; 