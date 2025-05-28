import { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search, Image as ImageIcon } from 'lucide-react';
import { Spinner } from '@/components/spinner';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { IRock, RockCategory } from './rock.interface';
import { useReadRocks } from './hooks/useReadRocks';
import RockContentForm from './components/rock-content-form';

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
  
  // Use external search term if provided, otherwise use internal
  const searchTerm = externalSearchTerm !== undefined ? externalSearchTerm : internalSearchTerm;
  
  // This will be implemented in the hooks folder
  const { data: rocks, isLoading, error } = useReadRocks(category);
  
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
    
    return filteredRocks.map((rock: IRock) => (
      <TableRow key={rock.id || rock.name} className="cursor-pointer hover:bg-gray-50" onClick={() => handleRockSelect(rock)}>
        {rock.image_url ? (
          <TableCell>
            <div className="w-10 h-10 relative">
              <img 
                src={rock.image_url} 
                alt={rock.name}
                className="w-10 h-10 object-cover rounded-md"
              />
            </div>
          </TableCell>
        ) : (
          <TableCell>
            <div className="w-10 h-10 bg-gray-200 rounded-md flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-gray-400" />
            </div>
          </TableCell>
        )}
        <TableCell className="font-medium break-words">{rock.name}</TableCell>
        
        {/* Ore Samples specific headers */}
        {category === 'Ore Samples' && (
          <TableCell className="break-words">{rock.rock_code || '-'}</TableCell>
        )}
        
        {/* Only show Category column when not in Ore Samples view */}
        {category !== 'Ore Samples' && (
          <TableCell>
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              {rock.category}
            </Badge>
          </TableCell>
        )}
        
        <TableCell className="break-words">{rock.type}</TableCell>
        
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
            <TableCell className="break-words">{rock.associated_minerals || '-'}</TableCell>
          </>
        )}
        
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
          {rock.latitude && rock.longitude ? 
            `${rock.latitude}, ${rock.longitude}` : 
            '-'}
        </TableCell>
        
        <TableCell>
          <Badge variant={rock.status === 'active' ? 'success' : 'destructive'}>
            {rock.status || 'inactive'}
          </Badge>
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
              placeholder="Search rocks..."
              value={internalSearchTerm}
              onChange={handleSearchChange}
              className="w-64"
            />
          </div>
          <RockContentForm category={category as RockCategory} />
        </div>
      )}
      
      <div className="rounded-md border overflow-x-auto max-w-full">
        <Table className="w-full table-auto" style={{ minWidth: '800px' }}>
          <TableHeader className="sticky top-0 bg-white z-10">
            <TableRow className="whitespace-nowrap">
              <TableHead className="w-16">Image</TableHead>
              <TableHead className="w-32">Name</TableHead>
              
              {/* Ore Samples specific headers */}
              {category === 'Ore Samples' && (
                <TableHead className="w-24">Rock Code</TableHead>
              )}
              
              {/* Only show Category column when not in Ore Samples view */}
              {category !== 'Ore Samples' && (
                <TableHead className="w-28">Category</TableHead>
              )}
              
              <TableHead className="w-28">Type</TableHead>
              
              {/* Ore Samples specific headers */}
              {category === 'Ore Samples' && (
                <>
                  <TableHead className="w-28">Commodity</TableHead>
                  <TableHead className="w-32">Ore Group</TableHead>
                  <TableHead className="w-40">Mining Company</TableHead>
                </>
              )}
              
              <TableHead className="w-28">Chemical</TableHead>
              <TableHead className="w-28">Color</TableHead>
              <TableHead className="w-20">Hardness</TableHead>
              
              {/* Only show texture and grain size for non-ore samples */}
              {category !== 'Ore Samples' && (
                <>
                  <TableHead className="w-28">Texture</TableHead>
                  <TableHead className="w-28">Grain Size</TableHead>
                </>
              )}
              
              {/* Igneous-specific fields */}
              {category === 'Igneous' && (
                <>
                  <TableHead className="w-28">Silica Content</TableHead>
                  <TableHead className="w-28">Cooling Rate</TableHead>
                  <TableHead className="w-28">Mineral Content</TableHead>
                </>
              )}
              
              {/* Sedimentary-specific fields */}
              {category === 'Sedimentary' && (
                <>
                  <TableHead className="w-28">Bedding</TableHead>
                  <TableHead className="w-28">Sorting</TableHead>
                  <TableHead className="w-28">Roundness</TableHead>
                  <TableHead className="w-28">Fossil Content</TableHead>
                  <TableHead className="w-28">Sediment Source</TableHead>
                </>
              )}
              
              {/* Metamorphic-specific fields */}
              {category === 'Metamorphic' && (
                <>
                  <TableHead className="w-28">Metamorphism Type</TableHead>
                  <TableHead className="w-28">Metamorphic Grade</TableHead>
                  <TableHead className="w-28">Parent Rock</TableHead>
                  <TableHead className="w-28">Foliation</TableHead>
                  <TableHead className="w-28">Associated Minerals</TableHead>
                </>
              )}
              
              {/* Label depends on category */}
              <TableHead className="w-28">
                {category === 'Ore Samples' ? 'Description' : 'Depositional Env.'}
              </TableHead>
              
              <TableHead className="w-28">Locality</TableHead>
              
              {/* Only show geological age and formation for non-ore samples */}
              {category !== 'Ore Samples' && (
                <>
                  <TableHead className="w-28">Geological Age</TableHead>
                  <TableHead className="w-28">Formation</TableHead>
                </>
              )}
              
              {/* Show coordinates for all rock types */}
              <TableHead className="w-36">Coordinates</TableHead>
              
              <TableHead className="w-24">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {renderTableContent()}
          </TableBody>
        </Table>
      </div>
      
      {/* Rock Details Dialog */}
      {selectedRock && (
        <Dialog open={!!selectedRock} onOpenChange={(open) => !open && setSelectedRock(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Rock Details</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="image">Image</TabsTrigger>
                {selectedRock.latitude && selectedRock.longitude && (
                  <TabsTrigger value="location">Location</TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Name</h4>
                    <p>{selectedRock.name}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Type</h4>
                    <p>{selectedRock.type || '-'}</p>
                  </div>
                  
                  {category === 'Ore Samples' && (
                    <>
                      <div>
                        <h4 className="text-sm font-medium mb-1">Rock Code</h4>
                        <p>{selectedRock.rock_code || '-'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-1">Commodity Type</h4>
                        <p>{selectedRock.commodity_type || '-'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-1">Ore Group</h4>
                        <p>{selectedRock.ore_group || '-'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-1">Mining Company</h4>
                        <p>{selectedRock.mining_company || '-'}</p>
                      </div>
                    </>
                  )}
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Chemical Formula</h4>
                    <p>{selectedRock.chemical_formula || '-'}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Color</h4>
                    <p>{selectedRock.color || '-'}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Hardness</h4>
                    <p>{selectedRock.hardness || '-'}</p>
                  </div>
                  
                  {category !== 'Ore Samples' && (
                    <>
                      <div>
                        <h4 className="text-sm font-medium mb-1">Texture</h4>
                        <p>{selectedRock.texture || '-'}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-1">Grain Size</h4>
                        <p>{selectedRock.grain_size || '-'}</p>
                      </div>
                    </>
                  )}
                  
                  {/* Igneous-specific fields in details */}
                  {category === 'Igneous' && (
                    <>
                      <div>
                        <h4 className="text-sm font-medium mb-1">Silica Content</h4>
                        <p>{selectedRock.silica_content || '-'}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-1">Cooling Rate</h4>
                        <p>{selectedRock.cooling_rate || '-'}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-1">Mineral Content</h4>
                        <p>{selectedRock.mineral_content || '-'}</p>
                      </div>
                    </>
                  )}
                  
                  {/* Sedimentary-specific fields in details */}
                  {category === 'Sedimentary' && (
                    <>
                      <div>
                        <h4 className="text-sm font-medium mb-1">Bedding</h4>
                        <p>{selectedRock.bedding || '-'}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-1">Sorting</h4>
                        <p>{selectedRock.sorting || '-'}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-1">Roundness</h4>
                        <p>{selectedRock.roundness || '-'}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-1">Fossil Content</h4>
                        <p>{selectedRock.fossil_content || '-'}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-1">Sediment Source</h4>
                        <p>{selectedRock.sediment_source || '-'}</p>
                      </div>
                    </>
                  )}
                  
                  {/* Metamorphic-specific fields in details */}
                  {category === 'Metamorphic' && (
                    <>
                      <div>
                        <h4 className="text-sm font-medium mb-1">Metamorphism Type</h4>
                        <p>{selectedRock.metamorphism_type || '-'}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-1">Metamorphic Grade</h4>
                        <p>{selectedRock.metamorphic_grade || '-'}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-1">Parent Rock</h4>
                        <p>{selectedRock.parent_rock || '-'}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-1">Foliation</h4>
                        <p>{selectedRock.foliation || '-'}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-1">Associated Minerals</h4>
                        <p>{selectedRock.associated_minerals || '-'}</p>
                      </div>
                    </>
                  )}
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">
                      {category === 'Ore Samples' ? 'Description' : 'Depositional Environment'}
                    </h4>
                    <p>
                      {category === 'Ore Samples' 
                        ? selectedRock.description || '-' 
                        : selectedRock.depositional_environment || '-'}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Locality</h4>
                    <p>{selectedRock.locality || '-'}</p>
                  </div>
                  
                  {category === 'Ore Samples' && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Coordinates</h4>
                      <p>
                        {selectedRock.latitude && selectedRock.longitude
                          ? `${selectedRock.latitude}, ${selectedRock.longitude}`
                          : '-'}
                      </p>
                    </div>
                  )}
                  
                  {category !== 'Ore Samples' && (
                    <>
                      <div>
                        <h4 className="text-sm font-medium mb-1">Geological Age</h4>
                        <p>{selectedRock.geological_age || '-'}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-1">Formation</h4>
                        <p>{selectedRock.formation || '-'}</p>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="image">
                {selectedRock.image_url ? (
                  <div className="flex justify-center">
                    <img 
                      src={selectedRock.image_url} 
                      alt={selectedRock.name}
                      className="max-w-full max-h-96 object-contain"
                    />
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ImageIcon className="w-16 h-16 mx-auto text-gray-300" />
                    <p className="mt-2 text-gray-500">No image available</p>
                  </div>
                )}
              </TabsContent>
              
              {selectedRock.latitude && selectedRock.longitude && (
                <TabsContent value="location">
                  <div className="h-96 bg-gray-100 flex items-center justify-center">
                    <p>Map view would display here for coordinates: {selectedRock.latitude}, {selectedRock.longitude}</p>
                  </div>
                </TabsContent>
              )}
            </Tabs>
            
            <div className="flex justify-end mt-4">
              <DialogClose asChild>
                <button className="px-4 py-2 bg-gray-100 rounded-md text-sm font-medium">
                  Close
                </button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default RocksList; 