import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, Upload } from "lucide-react";
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
import MineralsList from "../minerals/minerals-list";
import RocksList from "../rocks/rocks-list";
import { RockExcelImporter } from "../rocks/components";
import { MineralExcelImporter } from "../minerals/components";
import { MINERAL_CATEGORIES } from "../minerals/mineral.interface";
import { ROCK_CATEGORIES } from "../rocks/rock.interface";
import { MineralContentForm } from "../minerals/components";
import { RockContentForm } from "../rocks/components";

const GeologyPage = () => {
  const [activeTab, setActiveTab] = useState<"minerals" | "rocks">("minerals");
  const [mineralCategory, setMineralCategory] = useState<string>("ALL");
  const [rockCategory, setRockCategory] = useState<string>(ROCK_CATEGORIES[0]);
  const [searchTerm, setSearchTerm] = useState<string>("");
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
          onValueChange={(value) => setActiveTab(value as "minerals" | "rocks")}
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

              {/*               
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
              </Dialog> */}

              {activeTab === "minerals" ? (
                <MineralContentForm category={mineralCategory as any} />
              ) : (
                <RockContentForm category={rockCategory as any} />
              )}
            </div>
          </div>

          {/* Minerals Tab Content */}
          <TabsContent value="minerals" className="mt-6">

            <Tabs
              defaultValue={MINERAL_CATEGORIES[0]}
              value={mineralCategory}
              onValueChange={setMineralCategory}
              className="w-full"
            >
              <TabsList className="flex flex-wrap h-auto mb-4">
                {MINERAL_CATEGORIES.map((category) => (
                  <TabsTrigger
                    key={category}
                    value={category}
                    className="text-xs"
                  >
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>

              {MINERAL_CATEGORIES.map((category) => (
                <TabsContent
                  key={category}
                  value={category}
                  className="space-y-4"
                >
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

            <Tabs
              defaultValue={ROCK_CATEGORIES[0]}
              value={rockCategory}
              onValueChange={setRockCategory}
              className="w-full"
            >
              <TabsList className="flex flex-wrap h-auto mb-4">
                {ROCK_CATEGORIES.map((category) => (
                  <TabsTrigger
                    key={category}
                    value={category}
                    className="text-xs"
                  >
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>

              {ROCK_CATEGORIES.map((category) => (
                <TabsContent
                  key={category}
                  value={category}
                  className="space-y-4"
                >
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
