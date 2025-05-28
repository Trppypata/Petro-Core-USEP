import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MINERAL_CATEGORIES } from './mineral.interface';
import MineralsList from './minerals-list';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import MineralForm from './mineral-form';

const MineralsPage = () => {
  const [activeCategory, setActiveCategory] = useState<string>(MINERAL_CATEGORIES[0]);
  const [activeType, setActiveType] = useState<'mineral' | 'rock'>('mineral');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  
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
          defaultValue="mineral" 
          className="w-full"
          onValueChange={(value) => setActiveType(value as 'mineral' | 'rock')}
        >
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="mineral">Minerals</TabsTrigger>
              <TabsTrigger value="rock">Rocks</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-muted-foreground" />
                <Input 
                  placeholder={`Search ${activeType === 'mineral' ? 'minerals' : 'rocks'}...`} 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
              
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-1">
                    <Plus className="h-4 w-4" />
                    Add {activeType === 'mineral' ? 'Mineral' : 'Rock'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px]">
                  <DialogHeader>
                    <DialogTitle>Add New {activeType === 'mineral' ? 'Mineral' : 'Rock'}</DialogTitle>
                    <DialogDescription>
                      Fill in the details to add a new {activeType === 'mineral' ? 'mineral' : 'rock'} to the database.
                    </DialogDescription>
                  </DialogHeader>
                  <MineralForm 
                    category={activeType === 'mineral' ? activeCategory as any : 'ALL'} 
                    type={activeType}
                    onClose={() => setShowAddDialog(false)}
                    inDialog={true}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <TabsContent value="mineral" className="mt-6">
            {/* Mineral Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Minerals Database</CardTitle>
                <CardDescription>View and manage minerals categorized by type.</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs 
                  defaultValue={MINERAL_CATEGORIES[0]} 
                  value={activeCategory}
                  onValueChange={setActiveCategory} 
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
                        type="mineral" 
                        searchTerm={searchTerm}
                        hideControls={true}
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="rock" className="mt-6">
            {/* Rocks Categories - Simplified for now */}
            <Card>
              <CardHeader>
                <CardTitle>Rocks Database</CardTitle>
                <CardDescription>View and manage rocks categorized by type.</CardDescription>
              </CardHeader>
              <CardContent>
                <MineralsList 
                  category="ALL" 
                  type="rock" 
                  searchTerm={searchTerm}
                  hideControls={true}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MineralsPage; 