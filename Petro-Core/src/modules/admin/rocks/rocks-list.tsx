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
import { toast } from 'sonner';

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
  const [rockImages, setRockImages] = useState<Record<string, string[]>>({});
  
  // Use external search term if provided, otherwise use internal
  const searchTerm = externalSearchTerm !== undefined ? externalSearchTerm : internalSearchTerm;
  
  // This will be implemented in the hooks folder
  const { 
    data: rocks, 
    isLoading, 
    error, 
    pagination, 
    setPage, 
    setPageSize,
    refetch
  } = useReadRocks(category);
  
  const { isDeleting, deleteRock } = useDeleteRock();
  
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
      await deleteRock(rockToDelete.id);
      toast.success(`${rockToDelete.name} has been removed successfully.`);
      refetch();
    } catch (error) {
      console.error('Error deleting rock:', error);
      toast.error("Failed to delete rock. Please try again.");
    } finally {
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
  
  // Fetch images for rocks when the data changes
  useEffect(() => {
    const loadImagesForRocks = async () => {
      if (!filteredRocks?.length) return;
      
      // Limit to first 10 rocks to avoid too many requests
      const rocksToLoad = filteredRocks.slice(0, 10);
      
      try {
        // Import service dynamically to avoid circular dependencies
        const { getRockImages } = await import('@/services/rock-images.service');
        
        // Create a map to store images for each rock
        const imagesMap: Record<string, string[]> = {};
        
        // Load images for each rock
        await Promise.all(rocksToLoad.map(async (rock) => {
          if (!rock.id) return;
          
          try {
            const images = await getRockImages(rock.id);
            if (images && images.length > 0) {
              imagesMap[rock.id] = images.map(img => img.image_url);
              console.log(`Loaded ${images.length} images for rock ${rock.name}`);
            }
          } catch (err) {
            console.error(`Failed to load images for rock ${rock.name}:`, err);
          }
        }));
        
        setRockImages(imagesMap);
      } catch (error) {
        console.error('Failed to import rock-images service:', error);
      }
    };
    
    loadImagesForRocks();
  }, [filteredRocks]);
  
  const renderTableContent = () => {
    // Calculate colspan based on category
    const getColspan = () => {
      if (category === 'Igneous') return 14; // 4 base + 10 igneous specific
      if (category === 'Sedimentary') return 15; // 4 base + 11 sedimentary specific
      if (category === 'Metamorphic') return 13; // 4 base + 7 metamorphic specific + 2 actions/status
      if (category === 'Ore Samples') return 13; // 4 base + 7 ore samples specific + 2 actions/status
      return 11; // Default: 4 base + 5 general + 2 actions/status
    };
    
    if (isLoading) {
      return (
        <TableRow>
          <TableCell colSpan={getColspan()} className="h-24 text-center">
            <Spinner className="mx-auto" />
            <span className="sr-only">Loading rocks...</span>
          </TableCell>
        </TableRow>
      );
    }
    
    if (error) {
      return (
        <TableRow>
          <TableCell colSpan={getColspan()} className="h-24 text-center text-red-500">
            Error loading rocks. Please try again later.
          </TableCell>
        </TableRow>
      );
    }
    
    if (!filteredRocks || filteredRocks.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={getColspan()} className="h-24 text-center">
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
        
        // Find existing rock with the same code or name
        const existingByCodeIndex = unique.findIndex((r: IRock) => 
          r.rock_code && rock.rock_code && 
          r.rock_code.replace(/\s+/g, '').toLowerCase() === rock.rock_code.replace(/\s+/g, '').toLowerCase()
        );
        
        const existingByNameIndex = unique.findIndex((r: IRock) => 
          r.name && rock.name && 
          r.name.toLowerCase() === rock.name.toLowerCase() &&
          r.category === rock.category // Only consider same name a duplicate if same category
        );
        
        // Handle duplicates by code
        if (existingByCodeIndex >= 0) {
          // If we found a duplicate, keep the one with the most recent updated_at
          const existing = unique[existingByCodeIndex];
          if (rock.updated_at && existing.updated_at && new Date(rock.updated_at) > new Date(existing.updated_at)) {
            console.log(`Replacing duplicate rock by code: ${rock.name} replaces ${existing.name}`);
            unique[existingByCodeIndex] = rock;
          }
          return unique;
        }
        
        // Handle duplicates by name (only if code check didn't find a match)
        if (existingByNameIndex >= 0) {
          // If we found a duplicate by name, keep the one with the most recent updated_at
          const existing = unique[existingByNameIndex];
          if (rock.updated_at && existing.updated_at && new Date(rock.updated_at) > new Date(existing.updated_at)) {
            console.log(`Replacing duplicate rock by name: ${rock.name} (${rock.rock_code}) replaces ${existing.name} (${existing.rock_code})`);
            unique[existingByNameIndex] = rock;
          }
          return unique;
        }
        
        // No duplicate found, add to unique array
        unique.push(rock);
        return unique;
      }, []);
    
    console.log(`Filtered ${filteredRocks.length} rocks to ${processedRocks.length} unique rocks`);
    
    return processedRocks.map((rock: IRock) => {
      // Determine the appropriate rock-specific class based on the category
      const categoryClass = (() => {
        switch (rock.category.toLowerCase()) {
          case 'igneous':
            return 'hover:bg-igneous-bg';
          case 'metamorphic':
            return 'hover:bg-metamorphic-bg';
          case 'sedimentary':
            return 'hover:bg-sedimentary-bg';
          case 'ore samples':
            return 'hover:bg-ore-bg';
          default:
            return 'hover:bg-gray-50';
        }
      })();
      
      return (
        <TableRow 
          key={rock.id || rock.name} 
          className={`cursor-pointer ${categoryClass}`} 
          onClick={() => handleRockSelect(rock)}
        >
          {/* Image cell */}
          <TableCell>{renderRockImage(rock)}</TableCell>
          
          {/* Name */}
          <TableCell className="font-medium break-words">{rock.name}</TableCell>
          
          {/* Code */}
          <TableCell className="break-words">{rock.rock_code ? rock.rock_code.replace(/\s+/g, '') : '-'}</TableCell>
          
          {/* Category */}
          <TableCell>
            <Badge 
              variant="outline" 
              className={
                rock.category.toLowerCase() === 'igneous' ? 'bg-igneous/20 text-igneous border-igneous/30' :
                rock.category.toLowerCase() === 'metamorphic' ? 'bg-metamorphic/20 text-metamorphic border-metamorphic/30' :
                rock.category.toLowerCase() === 'sedimentary' ? 'bg-sedimentary/20 text-sedimentary border-sedimentary/30' :
                rock.category.toLowerCase() === 'ore samples' ? 'bg-ore/20 text-ore border-ore/30' :
                'bg-blue-100 text-blue-800'
              }
            >
              {rock.category}
            </Badge>
          </TableCell>
          
          {/* Conditional rendering based on category */}
          {category === 'Igneous' ? (
            <>
              {/* Locality */}
              <TableCell className="break-words">{rock.locality || '-'}</TableCell>
              
              {/* Coordinates */}
              <TableCell className="break-words">
                {rock.coordinates || 
                 (rock.latitude && rock.longitude ? 
                  `${rock.latitude}, ${rock.longitude}` : 
                  '-')}
              </TableCell>
              
              {/* Associated Minerals */}
              <TableCell className="break-words">{rock.associated_minerals || rock.mineral_composition || '-'}</TableCell>
              
              {/* Color */}
              <TableCell className="break-words">{rock.color || '-'}</TableCell>
              
              {/* Luster */}
              <TableCell className="break-words">{rock.luster || '-'}</TableCell>
              
              {/* Streak */}
              <TableCell className="break-words">{rock.streak || '-'}</TableCell>
              
              {/* Hardness */}
              <TableCell className="break-words">{rock.hardness || '-'}</TableCell>
              
              {/* Type */}
              <TableCell className="break-words">{rock.type || '-'}</TableCell>
              
              {/* Origin */}
              <TableCell className="break-words">{rock.origin || '-'}</TableCell>
              
              {/* Magnetism */}
              <TableCell className="break-words">{rock.magnetism || '-'}</TableCell>
            </>
          ) : category === 'Sedimentary' ? (
            <>
              {/* Type */}
              <TableCell className="break-words">{rock.type || '-'}</TableCell>
              
              {/* Depositional Environment */}
              <TableCell className="break-words">{rock.depositional_environment || '-'}</TableCell>
              
              {/* Grain Size */}
              <TableCell className="break-words">{rock.grain_size || '-'}</TableCell>
              
              {/* Texture */}
              <TableCell className="break-words">{rock.texture || '-'}</TableCell>
              
              {/* Sorting */}
              <TableCell className="break-words">{rock.sorting || '-'}</TableCell>
              
              {/* Associated Minerals */}
              <TableCell className="break-words">{rock.associated_minerals || rock.mineral_composition || '-'}</TableCell>
              
              {/* Color */}
              <TableCell className="break-words">{rock.color || '-'}</TableCell>
              
              {/* Fossils */}
              <TableCell className="break-words">{rock.fossil_content || '-'}</TableCell>
              
              {/* Reaction to HCL */}
              <TableCell className="break-words">{rock.reaction_to_hcl || '-'}</TableCell>
              
              {/* Locality */}
              <TableCell className="break-words">{rock.locality || '-'}</TableCell>
              
              {/* Coordinates */}
              <TableCell className="break-words">
                {rock.coordinates || 
                 (rock.latitude && rock.longitude ? 
                  `${rock.latitude}, ${rock.longitude}` : 
                  '-')}
              </TableCell>
            </>
          ) : category === 'Metamorphic' ? (
            <>
                             {/* Metamorphism */}
               <TableCell className="break-words">{rock.metamorphism_type || '-'}</TableCell>
              
              {/* Metamorphic Grade */}
              <TableCell className="break-words">{rock.metamorphic_grade || '-'}</TableCell>
              
              {/* Reaction to HCL */}
              <TableCell className="break-words">{rock.reaction_to_hcl || '-'}</TableCell>
              
              {/* Magnetism */}
              <TableCell className="break-words">{rock.magnetism || '-'}</TableCell>
              
              {/* Protolith */}
              <TableCell className="break-words">{rock.protolith || '-'}</TableCell>
              
              {/* Coordinates */}
              <TableCell className="break-words">
                {rock.coordinates || 
                 (rock.latitude && rock.longitude ? 
                  `${rock.latitude}, ${rock.longitude}` : 
                  '-')}
              </TableCell>
              
              {/* Locality */}
              <TableCell className="break-words">{rock.locality || '-'}</TableCell>
            </>
          ) : category === 'Ore Samples' ? (
            <>
              <TableCell className="break-words">{rock.rock_code || '-'}</TableCell>
              <TableCell className="break-words">{rock.commodity_type || '-'}</TableCell>
              <TableCell className="break-words">{rock.ore_group || '-'}</TableCell>
              <TableCell className="break-words">{rock.description || '-'}</TableCell>
              <TableCell className="break-words">{rock.locality || '-'}</TableCell>
              <TableCell className="break-words">{rock.mining_company || '-'}</TableCell>
              <TableCell className="break-words">
                {rock.coordinates || 
                 (rock.latitude && rock.longitude ? 
                  `${rock.latitude}, ${rock.longitude}` : 
                  '-')}
              </TableCell>
            </>
          ) : (
            <>
              {/* Type */}
              <TableCell className="break-words">{rock.type || '-'}</TableCell>
              
              {/* Color */}
              <TableCell className="break-words">{rock.color || '-'}</TableCell>
              
              {/* Mineral Composition */}
              <TableCell className="break-words">{rock.mineral_composition || rock.associated_minerals || '-'}</TableCell>
              
              {/* Locality */}
              <TableCell className="break-words">{rock.locality || '-'}</TableCell>
              
              {/* Coordinates */}
              <TableCell className="break-words">
                {rock.coordinates || 
                 (rock.latitude && rock.longitude ? 
                  `${rock.latitude}, ${rock.longitude}` : 
                  '-')}
              </TableCell>
            </>
          )}
          
          {/* Status */}
          <TableCell>
            <Badge variant={rock.status === 'active' ? 'success' : 'destructive'}>
              {rock.status || 'inactive'}
            </Badge>
          </TableCell>
          
          {/* Actions */}
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
                title="Edit"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={e => { 
                  e.stopPropagation(); 
                  setRockToDelete(rock); 
                }}
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      );
    });
  };
  
  // Render the rock image or fallback
  const renderRockImage = (rock: IRock) => {
    // Check if we have additional images for this rock
    const additionalImages = rock.id && rockImages[rock.id] ? rockImages[rock.id] : [];
    
    // Use main image or first additional image if available
    const imageUrl = rock.image_url || (additionalImages && additionalImages.length > 0 ? additionalImages[0] : null);
    
    if (imageUrl) {
      return (
        <div className="w-10 h-10 relative">
          <img 
            src={imageUrl} 
            alt={rock.name}
            className="w-10 h-10 object-cover rounded-md"
            onError={(e) => {
              console.error('Image failed to load:', imageUrl);
              // Replace with fallback image icon
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement?.classList.add('bg-gray-200', 'flex', 'items-center', 'justify-center');
              // Create and append fallback icon
              const icon = document.createElement('div');
              icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image text-gray-500"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
              e.currentTarget.parentElement?.appendChild(icon);
            }}
          />
          {additionalImages && additionalImages.length > 1 && (
            <div className="absolute -top-1 -right-1 bg-primary text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
              {additionalImages.length}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div className="w-10 h-10 bg-gray-200 rounded-md flex items-center justify-center">
          <ImageIcon className="w-5 h-5 text-gray-500" />
        </div>
      );
    }
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
              <TableHead>Category</TableHead>
              {category === 'Igneous' ? (
                <>
                  <TableHead>Locality</TableHead>
                  <TableHead>Coordinates</TableHead>
                  <TableHead>Associated Minerals</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Luster</TableHead>
                  <TableHead>Streak</TableHead>
                  <TableHead>Hardness</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Origin</TableHead>
                  <TableHead>Magnetism</TableHead>
                </>
              ) : category === 'Sedimentary' ? (
                <>
                  <TableHead>Type</TableHead>
                  <TableHead>Depositional Environment</TableHead>
                  <TableHead>Grain Size</TableHead>
                  <TableHead>Texture</TableHead>
                  <TableHead>Sorting</TableHead>
                  <TableHead>Associated Minerals</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Fossil Content</TableHead>
                  <TableHead>Reaction to HCL</TableHead>
                  <TableHead>Locality</TableHead>
                  <TableHead>Coordinates</TableHead>
                </>
              ) : category === 'Metamorphic' ? (
                <>
                  <TableHead>Metamorphism</TableHead>
                  <TableHead>Metamorphic Grade</TableHead>
                  <TableHead>Reaction to HCL</TableHead>
                  <TableHead>Magnetism</TableHead>
                  <TableHead>Protolith</TableHead>
                  <TableHead>Coordinates</TableHead>
                  <TableHead>Locality</TableHead>
                </>
              ) : category === 'Ore Samples' ? (
                <>
                  <TableHead>Rock Code</TableHead>
                  <TableHead>Type of Commodity</TableHead>
                  <TableHead>Ore Group</TableHead>
                  <TableHead>Overall Description</TableHead>
                  <TableHead>Locality</TableHead>
                  <TableHead>Mining Company</TableHead>
                  <TableHead>Coordinates</TableHead>
                </>
              ) : (
                <>
                  <TableHead>Type</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Mineral Composition</TableHead>
                  <TableHead>Locality</TableHead>
                  <TableHead>Coordinates</TableHead>
                </>
              )}
              <TableHead>Status</TableHead>
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