import { Card, CardDescription, CardHeader, CardTitle, CardContent, CardFooter } from "../ui/card";
import { SupabaseImage } from "../ui/supabase-image";
import { Badge } from "../ui/badge";

interface WorkCardProps {
  title: string;
  description: string;
  imageUrl?: string; // Optional image URL
  category?: string; // We'll keep the category prop but won't display it as a badge
  type?: 'rock' | 'mineral'; // Add type to distinguish between rocks and minerals
  texture?: string; // For igneous rocks
  foliation?: string; // For metamorphic rocks
  rockType?: string; // For sedimentary rocks
}

export function RockMineralsCard({ title, description, imageUrl, category, type = 'rock', texture, foliation, rockType }: WorkCardProps) {
  // Generate category badge color based on category name
  const getCategoryColor = (category?: string) => {
    if (!category) return "bg-muted/90 text-muted-foreground border-muted";
    
    switch (category.toLowerCase()) {
      case 'igneous':
        return "bg-igneous/80 text-white border-igneous";
      case 'sedimentary':
        return "bg-sedimentary/80 text-white border-sedimentary";
      case 'metamorphic':
        return "bg-metamorphic/80 text-white border-metamorphic";
      case 'ore samples':
        return "bg-ore/80 text-white border-ore";
      // Mineral categories
      case 'silicates':
        return "bg-primary/80 text-white border-primary";
      case 'oxides':
        return "bg-metamorphic/80 text-white border-metamorphic";
      case 'sulfides':
        return "bg-igneous/80 text-white border-igneous";
      case 'native elements':
        return "bg-ore/80 text-white border-ore";
      case 'carbonates':
      case 'carbonates ':
        return "bg-sedimentary/80 text-white border-sedimentary";
      case 'halides':
        return "bg-accent/80 text-white border-accent";
      case 'organics':
        return "bg-green-600/80 text-white border-green-600";
      default:
        return "bg-gray-700/80 text-white border-gray-700";
    }
  };
  
  // This function has been removed as we no longer show location information

  return (
    <Card className="overflow-hidden h-full group border-muted shadow-sm hover:shadow-md transition-all duration-200 bg-white">
      <div className="relative h-48 overflow-hidden">
        <SupabaseImage
          src={imageUrl}
          alt={title}
          height={192}
          width="100%"
          objectFit="cover"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {category && (
          <div className="absolute top-3 left-3 z-10">
            <Badge className={`${getCategoryColor(category)} font-semibold text-xs py-1 px-3 shadow-lg border`}>
              {category.toUpperCase()}
            </Badge>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      
      <CardContent className="p-4">
        <CardTitle className="text-lg font-semibold line-clamp-1 mb-1">{title}</CardTitle>
        {type === 'rock' && (
          <div className="text-xs font-medium text-gray-600 mt-1 mb-1">
            {category?.toLowerCase() === 'igneous' ? 'Texture:' :
             category?.toLowerCase() === 'metamorphic' ? 'Foliation:' :
             category?.toLowerCase() === 'sedimentary' ? 'Type:' :
             'Overall Description:'}
          </div>
        )}
        <CardDescription className="text-sm text-muted-foreground line-clamp-2">
          {type === 'rock' ? (
            category?.toLowerCase() === 'igneous' ? (texture || 'Not specified') :
            category?.toLowerCase() === 'metamorphic' ? (foliation || 'Not specified') :
            category?.toLowerCase() === 'sedimentary' ? (rockType || 'Not specified') :
            (description || 'No description available')
          ) : description}
        </CardDescription>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 text-xs text-muted-foreground">
        Click to view details
      </CardFooter>
    </Card>
  );
}

export default RockMineralsCard;
