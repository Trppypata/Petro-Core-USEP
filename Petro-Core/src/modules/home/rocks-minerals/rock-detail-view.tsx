import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import type { IRock } from "../../admin/rocks/rock.interface";
import { SupabaseImage } from "@/components/ui/supabase-image";
import { RockImagesGallery } from "@/components/ui/rock-images-gallery";
import { getRockImages } from "@/services/rock-images.service";
import { Badge } from "@/components/ui/badge";

// Function to fetch a single rock by ID
const fetchRockById = async (id: string): Promise<IRock | null> => {
  try {
    const API_URL = import.meta.env.VITE_local_url || 'http://localhost:8001/api';
    const response = await fetch(`${API_URL}/rocks/${id}`);
    const data = await response.json();
    
    if (!data.success || !data.data) {
      return null;
    }
    
    return data.data;
  } catch (error) {
    console.error("Error fetching rock details:", error);
    return null;
  }
};

// Function to get the primary property label based on rock category
const getPrimaryPropertyLabel = (category?: string): string => {
  const lowerCategory = category?.toLowerCase() || '';
  
  switch (lowerCategory) {
    case 'igneous':
      return 'Texture';
    case 'metamorphic':
      return 'Foliation';
    case 'sedimentary':
      return 'Type';
    case 'ore samples':
      return 'Overall Description';
    default:
      return 'Type';
  }
};

const getCategoryStyles = (category?: string) => {
  const lowerCategory = category?.toLowerCase() || '';
  
  switch (lowerCategory) {
    case 'igneous':
      return {
        cardClass: 'border-igneous/30',
        headerClass: 'bg-white border-b border-igneous/30',
        sectionClass: 'bg-white border-igneous/30',
        badgeClass: 'bg-igneous/20 text-igneous border-igneous/30'
      };
    case 'metamorphic':
      return {
        cardClass: 'border-metamorphic/30',
        headerClass: 'bg-white border-b border-metamorphic/30',
        sectionClass: 'bg-white border-metamorphic/30',
        badgeClass: 'bg-metamorphic/20 text-metamorphic border-metamorphic/30'
      };
    case 'sedimentary':
      return {
        cardClass: 'border-sedimentary/30',
        headerClass: 'bg-white border-b border-sedimentary/30',
        sectionClass: 'bg-white border-sedimentary/30',
        badgeClass: 'bg-sedimentary/20 text-sedimentary border-sedimentary/30'
      };
    case 'ore samples':
      return {
        cardClass: 'border-ore/30',
        headerClass: 'bg-white border-b border-ore/30',
        sectionClass: 'bg-white border-ore/30',
        badgeClass: 'bg-ore/20 text-ore border-ore/30'
      };
    default:
      return {
        cardClass: '',
        headerClass: 'bg-white',
        sectionClass: 'bg-white',
        badgeClass: 'bg-blue-100 text-blue-800'
      };
  }
};

const RockDetailView = () => {
  const { id } = useParams<{ id: string }>();
  const [rock, setRock] = useState<IRock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rockImages, setRockImages] = useState<string[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);

  useEffect(() => {
    const loadRock = async () => {
      if (!id) {
        setError("No rock ID provided");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const rockData = await fetchRockById(id);
        if (rockData) {
          setRock(rockData);
          
          // Now load rock images
          await loadRockImages(rockData);
        } else {
          setError("Rock not found");
        }
      } catch (err) {
        setError("Failed to load rock details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadRock();
  }, [id]);
  
  // Separated function to load images
  const loadRockImages = async (rockData: IRock) => {
    if (!rockData.id) return;
    
    setLoadingImages(true);
    console.log("🖼️ Loading images for rock:", rockData.id);
    
    try {
      // Start with main image if available
      const images: string[] = [];
      if (rockData.image_url) {
        console.log("🖼️ Main image URL:", rockData.image_url);
        images.push(rockData.image_url);
      }
      
      // Get additional images
      const additionalImages = await getRockImages(rockData.id);
      console.log(`🖼️ Fetched ${additionalImages.length} additional images`);
      
      if (additionalImages && additionalImages.length > 0) {
        // Extract image URLs from the image objects
        const imageUrls = additionalImages.map(img => img.image_url);
        console.log("🖼️ Additional image URLs:", imageUrls);
        
        // Add them to our images array without duplicating the main image
        if (rockData.image_url) {
          const filteredUrls = imageUrls.filter(url => url !== rockData.image_url);
          images.push(...filteredUrls);
        } else {
          images.push(...imageUrls);
        }
      }
      
      console.log(`🖼️ Total images to display: ${images.length}`);
      setRockImages(images);
    } catch (err) {
      console.error("Failed to load rock images:", err);
    } finally {
      setLoadingImages(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !rock) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Link to="/rock-minerals">
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Rocks
          </Button>
        </Link>
        <div className="text-center py-8 bg-white rounded-lg shadow">
          <h2 className="text-2xl font-bold text-red-500 mb-2">Error</h2>
          <p className="text-muted-foreground">{error || "Rock not found"}</p>
        </div>
      </div>
    );
  }

  const styles = getCategoryStyles(rock.category);
  const primaryLabel = getPrimaryPropertyLabel(rock.category);
  const isOre = rock.category.toLowerCase() === 'ore samples';

  // Determine which value to show for the primary property label
  const getPrimaryPropertyValue = () => {
    const category = rock.category.toLowerCase();
    switch(category) {
      case 'igneous':
        return rock.texture || 'Not specified';
      case 'metamorphic':
        return rock.foliation || 'Not specified';
      case 'sedimentary':
        return rock.type || 'Not specified';
      case 'ore samples':
        return rock.description || 'No description available';
      default:
        return rock.type || 'Not specified';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/rock-minerals">
        <Button variant="outline" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Rocks
        </Button>
      </Link>
      
      <Card className={`p-0 mb-6 overflow-hidden ${styles.cardClass}`}>
        <div className={`px-8 py-4 ${styles.headerClass}`}>
          <h1 className="text-3xl font-bold">{rock.name}</h1>
          <div className="flex items-center space-x-2 mt-2">
            <Badge variant="outline" className={styles.badgeClass}>
              {rock.category}
            </Badge>
            {rock.rock_code && (
              <span className="text-sm text-muted-foreground">Code: {rock.rock_code}</span>
            )}
          </div>
        </div>
        
        <div className="p-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left: Rock Image */}
            <div className="w-full md:w-1/2">
              {loadingImages ? (
                <div className="flex items-center justify-center bg-muted rounded-lg" style={{ height: "400px", width: "100%" }}>
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : rockImages.length > 0 ? (
                <div className={`flex justify-center items-center rounded-lg ${styles.sectionClass}`} style={{ minHeight: "400px", width: "100%" }}>
                  <RockImagesGallery 
                    images={rockImages} 
                    aspectRatio="square" 
                    height={400}
                    className="w-full max-w-md"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center bg-muted rounded-lg" style={{ height: "400px", width: "100%" }}>
                  <p className="text-muted-foreground">No image available</p>
                </div>
              )}
            </div>
            
            {/* Right: Rock Properties */}
            <div className="w-full md:w-1/2">
              {/* Primary Property Label (based on rock category) */}
              <div className="mb-6">
                <h3 className="text-base font-bold text-gray-700">{primaryLabel}</h3>
                <p className="text-lg">{getPrimaryPropertyValue()}</p>
              </div>
              
              {/* Ore-specific: Type of Commodity */}
              {isOre && rock.commodity_type && (
                <div className="mb-6">
                  <h3 className="text-base font-bold text-gray-700">Type of Commodity</h3>
                  <p className="text-lg">{rock.commodity_type}</p>
                </div>
              )}
              
              {rock.category && (
                <div className="mb-6">
                  <h3 className="text-base font-bold text-gray-700">Category</h3>
                  <p className="text-lg">{rock.category}</p>
                </div>
              )}
              
              {rock.color && (
                <div className="mb-6">
                  <h3 className="text-base font-bold text-gray-700">Color</h3>
                  <p className="text-lg">{rock.color}</p>
                </div>
              )}
              
              {/* Only show texture if not already shown as the primary property */}
              {rock.texture && rock.category.toLowerCase() !== 'igneous' && (
                <div className="mb-6">
                  <h3 className="text-base font-bold text-gray-700">Texture</h3>
                  <p className="text-lg">{rock.texture}</p>
                </div>
              )}
              
              {rock.mineral_composition && (
                <div className="mb-6">
                  <h3 className="text-base font-bold text-gray-700">Mineral Composition</h3>
                  <p className="text-lg">{rock.mineral_composition}</p>
                </div>
              )}
              
              {rock.hardness && (
                <div className="mb-6">
                  <h3 className="text-base font-bold text-gray-700">Hardness</h3>
                  <p className="text-lg">{rock.hardness}</p>
                </div>
              )}
              
              {rock.grain_size && (
                <div className="mb-6">
                  <h3 className="text-base font-bold text-gray-700">Grain Size</h3>
                  <p className="text-lg">{rock.grain_size}</p>
                </div>
              )}
              
              {rock.chemical_formula && (
                <div className="mb-6">
                  <h3 className="text-base font-bold text-gray-700">Chemical Formula</h3>
                  <p className="text-lg">{rock.chemical_formula}</p>
                </div>
              )}
              
              {/* Location info */}
              {rock.locality && (
                <div className="mb-6">
                  <h3 className="text-base font-bold text-gray-700">Locality</h3>
                  <p className="text-lg">{rock.locality}</p>
                </div>
              )}
              
              {rock.coordinates && (
                <div className="mb-6">
                  <h3 className="text-base font-bold text-gray-700">Coordinates</h3>
                  <p className="text-lg">{rock.coordinates}</p>
                </div>
              )}
              
              {(!rock.coordinates && rock.latitude && rock.longitude) && (
                <div className="mb-6">
                  <h3 className="text-base font-bold text-gray-700">Coordinates</h3>
                  <p className="text-lg">{rock.latitude}, {rock.longitude}</p>
                </div>
              )}
            </div>
          </div>
          
          {rock.description && !isOre && ( // Don't show description here for ore samples since it's shown as the primary property
            <div className="mt-6">
              <h3 className="text-lg font-bold text-gray-700 mb-2">Description</h3>
              <p className="text-muted-foreground">{rock.description}</p>
            </div>
          )}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Location Information */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Location Information</h2>
          
          {rock.formation && (
            <div className="mb-4">
              <h3 className="text-base font-bold text-gray-700">Formation</h3>
              <p className="text-lg">{rock.formation}</p>
            </div>
          )}
          
          {rock.geological_age && (
            <div className="mb-4">
              <h3 className="text-base font-bold text-gray-700">Geological Age</h3>
              <p className="text-lg">{rock.geological_age}</p>
            </div>
          )}
          
          {rock.depositional_environment && (
            <div className="mb-4">
              <h3 className="text-base font-bold text-gray-700">Depositional Environment</h3>
              <p className="text-lg">{rock.depositional_environment}</p>
            </div>
          )}
          
          {!rock.formation && !rock.geological_age && !rock.depositional_environment && (
            <p className="text-muted-foreground">No additional location information available</p>
          )}
        </Card>

        {/* Associated Minerals */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Mineral Information</h2>
          
          {rock.associated_minerals && (
            <div className="mb-4">
              <h3 className="text-base font-bold text-gray-700">Associated Minerals</h3>
              <p className="text-lg">{rock.associated_minerals}</p>
            </div>
          )}
          
          {rock.mineral_content && (
            <div className="mb-4">
              <h3 className="text-base font-bold text-gray-700">Mineral Content</h3>
              <p className="text-lg">{rock.mineral_content}</p>
            </div>
          )}
          
          {rock.silica_content && (
            <div className="mb-4">
              <h3 className="text-base font-bold text-gray-700">Silica Content</h3>
              <p className="text-lg">{rock.silica_content}</p>
            </div>
          )}
          
          {!rock.associated_minerals && !rock.mineral_content && !rock.silica_content && (
            <p className="text-muted-foreground">No mineral information available</p>
          )}
        </Card>
      </div>

      {/* Other Information - Combined section for category-specific properties and physical properties */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Other Information</h2>
          
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
          {/* Category-specific properties */}
            {rock.category.toLowerCase() === 'igneous' && (
              <>
                {rock.origin && (
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-gray-700">Origin</h3>
                    <p className="text-lg">{rock.origin}</p>
                  </div>
                )}
                
                {rock.cooling_rate && (
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-gray-700">Cooling Rate</h3>
                    <p className="text-lg">{rock.cooling_rate}</p>
                  </div>
                )}
              </>
            )}
            
            {rock.category.toLowerCase() === 'metamorphic' && (
              <>
                {rock.metamorphism_type && (
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-gray-700">Metamorphism Type</h3>
                    <p className="text-lg">{rock.metamorphism_type}</p>
                  </div>
                )}
                
                {rock.metamorphic_grade && (
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-gray-700">Metamorphic Grade</h3>
                    <p className="text-lg">{rock.metamorphic_grade}</p>
                  </div>
                )}
                
                {rock.parent_rock && (
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-gray-700">Parent Rock</h3>
                    <p className="text-lg">{rock.parent_rock}</p>
                  </div>
                )}
                
                {rock.protolith && !rock.parent_rock && (
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-gray-700">Protolith</h3>
                    <p className="text-lg">{rock.protolith}</p>
                  </div>
                )}
                
                {rock.foliation && (
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-gray-700">Foliation</h3>
                    <p className="text-lg">{rock.foliation}</p>
                  </div>
                )}
                
                {rock.foliation_type && (
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-gray-700">Foliation Type</h3>
                    <p className="text-lg">{rock.foliation_type}</p>
                  </div>
                )}
              </>
            )}
            
            {rock.category.toLowerCase() === 'sedimentary' && (
              <>
                {rock.bedding && (
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-gray-700">Bedding</h3>
                    <p className="text-lg">{rock.bedding}</p>
                  </div>
                )}
                
                {rock.sorting && (
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-gray-700">Sorting</h3>
                    <p className="text-lg">{rock.sorting}</p>
                  </div>
                )}
                
                {rock.roundness && (
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-gray-700">Roundness</h3>
                    <p className="text-lg">{rock.roundness}</p>
                  </div>
                )}
                
                {rock.fossil_content && (
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-gray-700">Fossil Content</h3>
                    <p className="text-lg">{rock.fossil_content}</p>
                  </div>
                )}
                
                {rock.sediment_source && (
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-gray-700">Sediment Source</h3>
                    <p className="text-lg">{rock.sediment_source}</p>
                  </div>
                )}
              </>
            )}
            
            {rock.category.toLowerCase() === 'ore samples' && (
              <>
                {rock.commodity_type && (
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-gray-700">Commodity Type</h3>
                    <p className="text-lg">{rock.commodity_type}</p>
                  </div>
                )}
                
                {rock.ore_group && (
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-gray-700">Ore Group</h3>
                    <p className="text-lg">{rock.ore_group}</p>
                  </div>
                )}
                
                {rock.mining_company && (
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-gray-700">Mining Company</h3>
                    <p className="text-lg">{rock.mining_company}</p>
                  </div>
                )}
              </>
            )}
          
          {/* Physical properties */}
          {rock.luster && (
            <div className="mb-4">
              <h3 className="text-base font-bold text-gray-700">Luster</h3>
              <p className="text-lg">{rock.luster}</p>
            </div>
          )}
          
          {rock.streak && (
            <div className="mb-4">
              <h3 className="text-base font-bold text-gray-700">Streak</h3>
              <p className="text-lg">{rock.streak}</p>
            </div>
          )}
          
          {rock.reaction_to_hcl && (
            <div className="mb-4">
              <h3 className="text-base font-bold text-gray-700">Reaction to HCl</h3>
              <p className="text-lg">{rock.reaction_to_hcl}</p>
            </div>
          )}
          
          {rock.magnetism && (
            <div className="mb-4">
              <h3 className="text-base font-bold text-gray-700">Magnetism</h3>
              <p className="text-lg">{rock.magnetism}</p>
            </div>
          )}
          
          {/* Show empty state if no properties available */}
          {((rock.category.toLowerCase() === 'igneous' && !rock.origin && !rock.cooling_rate) ||
            (rock.category.toLowerCase() === 'metamorphic' && !rock.metamorphism_type && !rock.metamorphic_grade && 
             !rock.parent_rock && !rock.protolith && !rock.foliation && !rock.foliation_type) ||
            (rock.category.toLowerCase() === 'sedimentary' && !rock.bedding && !rock.sorting && 
             !rock.roundness && !rock.fossil_content && !rock.sediment_source) ||
            (rock.category.toLowerCase() === 'ore samples' && !rock.commodity_type && 
             !rock.ore_group && !rock.mining_company)) &&
           !rock.luster && !rock.streak && !rock.reaction_to_hcl && !rock.magnetism && (
            <p className="text-muted-foreground col-span-2">No additional information available</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default RockDetailView; 