import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import type { IRock } from "../../admin/rocks/rock.interface";
import { SupabaseImage } from "@/components/ui/supabase-image";
import { RockImagesGallery } from "@/components/ui/rock-images-gallery";
import { getRockImages } from "@/services/rock-images.service";

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

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/rock-minerals">
        <Button variant="outline" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Rocks
        </Button>
      </Link>
      
      <Card className="p-8 mb-6">
        <h1 className="text-3xl font-bold mb-2">{rock.name}</h1>
        <p className="text-muted-foreground mb-6">
          {rock.category} {rock.rock_code && `| Code: ${rock.rock_code}`}
        </p>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left: Rock Image */}
          <div className="w-full md:w-1/2">
            {loadingImages ? (
              <div className="flex items-center justify-center bg-muted rounded-lg" style={{ height: "400px", width: "100%" }}>
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : rockImages.length > 0 ? (
              <div className="flex justify-center items-center bg-gray-50 rounded-lg" style={{ minHeight: "400px", width: "100%" }}>
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
            {rock.type && (
              <div className="mb-6">
                <h3 className="text-base font-medium">Type</h3>
                <p className="text-lg">{rock.type}</p>
              </div>
            )}
            
            {rock.category && (
              <div className="mb-6">
                <h3 className="text-base font-medium">Category</h3>
                <p className="text-lg">{rock.category}</p>
              </div>
            )}
            
            {rock.color && (
              <div className="mb-6">
                <h3 className="text-base font-medium">Color</h3>
                <p className="text-lg">{rock.color}</p>
              </div>
            )}
            
            {rock.texture && (
              <div className="mb-6">
                <h3 className="text-base font-medium">Texture</h3>
                <p className="text-lg">{rock.texture}</p>
              </div>
            )}
            
            {rock.mineral_composition && (
              <div className="mb-6">
                <h3 className="text-base font-medium">Mineral Composition</h3>
                <p className="text-lg">{rock.mineral_composition}</p>
              </div>
            )}
            
            {rock.hardness && (
              <div className="mb-6">
                <h3 className="text-base font-medium">Hardness</h3>
                <p className="text-lg">{rock.hardness}</p>
              </div>
            )}
            
            {rock.grain_size && (
              <div className="mb-6">
                <h3 className="text-base font-medium">Grain Size</h3>
                <p className="text-lg">{rock.grain_size}</p>
              </div>
            )}
            
            {rock.chemical_formula && (
              <div className="mb-6">
                <h3 className="text-base font-medium">Chemical Formula</h3>
                <p className="text-lg">{rock.chemical_formula}</p>
              </div>
            )}
          </div>
        </div>
        
        {rock.description && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Description</h3>
            <p className="text-muted-foreground">{rock.description}</p>
          </div>
        )}
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Location Information */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Location Information</h2>
          
          {rock.locality && (
            <div className="mb-4">
              <h3 className="text-base font-medium">Locality</h3>
              <p className="text-lg">{rock.locality}</p>
            </div>
          )}
          
          {rock.coordinates && (
            <div className="mb-4">
              <h3 className="text-base font-medium">Coordinates</h3>
              <p className="text-lg">{rock.coordinates}</p>
            </div>
          )}
          
          {(!rock.coordinates && rock.latitude && rock.longitude) && (
            <div className="mb-4">
              <h3 className="text-base font-medium">Coordinates</h3>
              <p className="text-lg">{rock.latitude}, {rock.longitude}</p>
            </div>
          )}
          
          {rock.formation && (
            <div className="mb-4">
              <h3 className="text-base font-medium">Formation</h3>
              <p className="text-lg">{rock.formation}</p>
            </div>
          )}
          
          {rock.geological_age && (
            <div className="mb-4">
              <h3 className="text-base font-medium">Geological Age</h3>
              <p className="text-lg">{rock.geological_age}</p>
            </div>
          )}
          
          {!rock.locality && !rock.coordinates && !rock.latitude && !rock.longitude && 
           !rock.formation && !rock.geological_age && (
            <p className="text-muted-foreground">No location information available</p>
          )}
        </Card>

        {/* Additional Properties */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Additional Properties</h2>
          
          <div className="space-y-4">
            {rock.metamorphism_type && (
              <div className="mb-4">
                <h3 className="text-base font-medium">Metamorphism Type</h3>
                <p className="text-lg">{rock.metamorphism_type}</p>
              </div>
            )}
            
            {rock.metamorphic_grade && (
              <div className="mb-4">
                <h3 className="text-base font-medium">Metamorphic Grade</h3>
                <p className="text-lg">{rock.metamorphic_grade}</p>
              </div>
            )}
            
            {rock.parent_rock && (
              <div className="mb-4">
                <h3 className="text-base font-medium">Parent Rock</h3>
                <p className="text-lg">{rock.parent_rock}</p>
              </div>
            )}
            
            {rock.foliation && (
              <div className="mb-4">
                <h3 className="text-base font-medium">Foliation</h3>
                <p className="text-lg">{rock.foliation}</p>
              </div>
            )}
            
            {rock.silica_content && (
              <div className="mb-4">
                <h3 className="text-base font-medium">Silica Content</h3>
                <p className="text-lg">{rock.silica_content}</p>
              </div>
            )}
            
            {rock.cooling_rate && (
              <div className="mb-4">
                <h3 className="text-base font-medium">Cooling Rate</h3>
                <p className="text-lg">{rock.cooling_rate}</p>
              </div>
            )}
            
            {rock.bedding && (
              <div className="mb-4">
                <h3 className="text-base font-medium">Bedding</h3>
                <p className="text-lg">{rock.bedding}</p>
              </div>
            )}
            
            {rock.sorting && (
              <div className="mb-4">
                <h3 className="text-base font-medium">Sorting</h3>
                <p className="text-lg">{rock.sorting}</p>
              </div>
            )}
            
            {rock.roundness && (
              <div className="mb-4">
                <h3 className="text-base font-medium">Roundness</h3>
                <p className="text-lg">{rock.roundness}</p>
              </div>
            )}
            
            {rock.fossil_content && (
              <div className="mb-4">
                <h3 className="text-base font-medium">Fossil Content</h3>
                <p className="text-lg">{rock.fossil_content}</p>
              </div>
            )}
            
            {!rock.metamorphism_type && !rock.metamorphic_grade && !rock.parent_rock && 
             !rock.foliation && !rock.silica_content && !rock.cooling_rate && 
             !rock.bedding && !rock.sorting && !rock.roundness && !rock.fossil_content && (
              <p className="text-muted-foreground">No additional properties available</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RockDetailView; 