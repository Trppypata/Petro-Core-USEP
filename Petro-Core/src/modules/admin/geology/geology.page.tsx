import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Download, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import MineralsList from '../minerals/minerals-list';
import RocksList from '../rocks/rocks-list';
import { RockExcelImporter } from '../rocks/components';
import { MineralExcelImporter } from '../minerals/components';
import { MINERAL_CATEGORIES } from '../minerals/mineral.interface';
import { ROCK_CATEGORIES } from '../rocks/rock.interface';
import { MineralContentForm } from '../minerals/components';
import { RockContentForm } from '../rocks/components';

const GeologyPage = () => {
  const [activeTab, setActiveTab] = useState<'minerals' | 'rocks'>('minerals');
  const [mineralCategory, setMineralCategory] = useState<string>('ALL');
  const [rockCategory, setRockCategory] = useState<string>(ROCK_CATEGORIES[0]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showImportDialog, setShowImportDialog] = useState(false);
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">Geological Database</h1>
        <p className="text-muted-foreground">
          Browse and manage minerals and rocks in the database.
        </p>
      </div>
      
      {/* Top-level Minerals/Rocks Navigation */}
      <div className="border-b">
        <Tabs 
          defaultValue="minerals" 
          className="w-full"
          onValueChange={(value) => setActiveTab(value as 'minerals' | 'rocks')}
        >
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="minerals">Minerals</TabsTrigger>
              <TabsTrigger value="rocks">Rocks</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-muted-foreground" />
                <Input 
                  placeholder={`Search ${activeTab}...`} 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
              
              <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-1">
                    <Upload className="h-4 w-4" />
                    Import from Excel
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px]">
                  <DialogHeader>
                    <DialogTitle>Import Data from Excel</DialogTitle>
                    <DialogDescription>
                      Upload an Excel file to import {activeTab} data in bulk.
                    </DialogDescription>
                  </DialogHeader>
                  
                  {activeTab === 'rocks' && (
                    <RockExcelImporter onImportComplete={() => setShowImportDialog(false)} />
                  )}
                  
                  {activeTab === 'minerals' && (
                    <MineralExcelImporter onImportComplete={() => setShowImportDialog(false)} />
                  )}
                </DialogContent>
              </Dialog>
              
              {activeTab === 'minerals' ? (
                <MineralContentForm category={mineralCategory as any} />
              ) : (
                <RockContentForm category={rockCategory as any} />
              )}
            </div>
          </div>
          
          {/* Minerals Tab Content */}
          <TabsContent value="minerals" className="mt-6">
            <Accordion type="single" collapsible className="mb-4">
              <AccordionItem value="import-help">
                <AccordionTrigger>Database Structure & Excel Import Guide</AccordionTrigger>
                <AccordionContent>
                  <div className="text-sm space-y-2">
                    <p>
                      The minerals database is organized by mineral categories (Sulfates, Borates, Oxides, etc.).
                    </p>
                    <p>
                      To import minerals from an Excel file, your file should have the following columns:
                    </p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li><strong>Mineral Code</strong>: A unique identifier (e.g., M-0001)</li>
                      <li><strong>Mineral Name</strong>: The name of the mineral (e.g., Quartz, Calcite)</li>
                      <li><strong>Chemical Formula</strong>: The chemical composition (e.g., SiO₂, CaCO₃)</li>
                      <li><strong>Mineral Group</strong>: The mineral group/family (e.g., Silicates, Carbonates)</li>
                      <li><strong>Color</strong>: The color of the mineral (e.g., Clear, White, Pink)</li>
                      <li><strong>Streak</strong>: The color of the mineral's powder</li>
                      <li><strong>Luster</strong>: How the mineral reflects light (e.g., Vitreous, Metallic)</li>
                      <li><strong>Hardness</strong>: The mineral's hardness on the Mohs scale</li>
                      <li><strong>Cleavage</strong>: How the mineral breaks along planes (e.g., Perfect, None)</li>
                      <li><strong>Fracture</strong>: How the mineral breaks irregularly (e.g., Conchoidal, Uneven)</li>
                      <li><strong>Habit</strong>: The mineral's typical form (e.g., Cubic, Prismatic)</li>
                      <li><strong>Crystal System</strong>: The mineral's crystallographic system (e.g., Cubic, Hexagonal)</li>
                    </ul>
                    <div className="mt-4">
                      <a 
                        href="/src/assets/DK_MINERALS_DATABASE.xlsx" 
                        download
                        className="inline-flex items-center text-blue-600 hover:underline"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download Sample Excel Template
                      </a>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <Tabs 
              defaultValue={MINERAL_CATEGORIES[0]} 
              value={mineralCategory}
              onValueChange={setMineralCategory}
              className="w-full"
            >
              <TabsList className="flex flex-wrap h-auto mb-4">
                {MINERAL_CATEGORIES.map((category) => (
                  <TabsTrigger key={category} value={category} className="text-xs">
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {MINERAL_CATEGORIES.map((category) => (
                <TabsContent key={category} value={category} className="space-y-4">
                  <MineralsList 
                    category={category} 
                    searchTerm={searchTerm}
                    hideControls={true}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>
          
          {/* Rocks Tab Content */}
          <TabsContent value="rocks" className="mt-6">
            <Accordion type="single" collapsible className="mb-4">
              <AccordionItem value="import-help">
                <AccordionTrigger>Database Structure & Excel Import Guide</AccordionTrigger>
                <AccordionContent>
                  <div className="text-sm space-y-2">
                    <p>
                      The rocks database is organized by rock categories (Igneous, Sedimentary, Metamorphic, etc.).
                    </p>
                    <p>
                      To import rocks from an Excel file, your file should have the following columns:
                    </p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li><strong>Rock Code</strong>: A unique identifier (e.g., S-0001, I-0001, M-0001, O-0001)</li>
                      <li><strong>Rock Name</strong>: The name of the rock (e.g., Granite, Limestone)</li>
                      <li><strong>Category</strong>: The rock category (Igneous, Sedimentary, Metamorphic, or Ore Samples)</li>
                      <li><strong>Type</strong>: The rock type (e.g., Igneous, Sedimentary)</li>
                      <li><strong>Depositional Environment</strong>: Where the rock formed (e.g., Shallow Marine)</li>
                      <li><strong>Grain Size</strong>: Description of grain size (e.g., Fine-grained)</li>
                      <li><strong>Chemical Formula</strong>: The chemical composition if applicable</li>
                      <li><strong>Hardness</strong>: The rock's hardness on the Mohs scale</li>
                      <li><strong>Color</strong>: The color of the rock (e.g., Gray, Pink, White)</li>
                      <li><strong>Texture</strong>: The texture of the rock (e.g., Porphyritic, Vesicular)</li>
                      <li><strong>Coordinates</strong>: Combined geographic coordinates (e.g., "7.0622° N, 125.6072° E")</li>
                      <li><strong>Latitude</strong>: Geographic coordinate - latitude (e.g., "7.0622° N")</li>
                      <li><strong>Longitude</strong>: Geographic coordinate - longitude (e.g., "125.6072° E")</li>
                      <li><strong>Locality</strong>: Location where the rock was found</li>
                      <li><strong>Mineral Composition</strong>: Major minerals in the rock</li>
                      <li><strong>Description</strong>: Detailed description of the rock</li>
                      <li><strong>Formation</strong>: Geological formation</li>
                      <li><strong>Geological Age</strong>: Age or period of formation</li>
                      <li><strong>Status</strong>: Whether the rock is active or inactive (default: active)</li>
                    </ul>
                    <p className="mt-2 text-sm text-blue-600">
                      <strong>For Ore Samples</strong>: Make sure to include Commodity Type, Ore Group, and Mining Company fields.
                    </p>
                    <div className="mt-4">
                      <a 
                        href="/src/assets/Database.xlsx" 
                        download
                        className="inline-flex items-center text-blue-600 hover:underline"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download Sample Excel Template
                      </a>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <Tabs 
              defaultValue={ROCK_CATEGORIES[0]} 
              value={rockCategory}
              onValueChange={setRockCategory}
              className="w-full"
            >
              <TabsList className="flex flex-wrap h-auto mb-4">
                {ROCK_CATEGORIES.map((category) => (
                  <TabsTrigger key={category} value={category} className="text-xs">
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {ROCK_CATEGORIES.map((category) => (
                <TabsContent key={category} value={category} className="space-y-4">
                  <RocksList 
                    category={category} 
                    searchTerm={searchTerm}
                    hideControls={true}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default GeologyPage; 