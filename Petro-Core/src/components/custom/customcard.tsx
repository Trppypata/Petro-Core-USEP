import { Card, CardDescription, CardHeader, CardTitle, CardContent, CardFooter } from "../ui/card";
import { SupabaseImage } from "../ui/supabase-image";
import { Badge } from "../ui/badge";

interface WorkCardProps {
  title: string;
  description: string;
  imageUrl?: string; // Optional image URL
  category?: string; // We'll keep the category prop but won't display it as a badge
}

export function RockMineralsCard({ title, description, imageUrl, category }: WorkCardProps) {
  // Generate category badge color based on category name
  const getCategoryColor = (category?: string) => {
    if (!category) return "bg-muted text-muted-foreground";
    
    switch (category.toLowerCase()) {
      case 'igneous':
        return "bg-igneous/20 text-igneous border-igneous/30";
      case 'sedimentary':
        return "bg-sedimentary/20 text-sedimentary border-sedimentary/30";
      case 'metamorphic':
        return "bg-metamorphic/20 text-metamorphic border-metamorphic/30";
      case 'ore samples':
        return "bg-ore/20 text-ore border-ore/30";
      // Mineral categories
      case 'silicates':
        return "bg-primary/20 text-primary border-primary/30";
      case 'oxides':
        return "bg-metamorphic/20 text-metamorphic border-metamorphic/30";
      case 'sulfides':
        return "bg-igneous/20 text-igneous border-igneous/30";
      case 'native elements':
        return "bg-ore/20 text-ore border-ore/30";
      case 'carbonates':
      case 'carbonates ':
        return "bg-sedimentary/20 text-sedimentary border-sedimentary/30";
      case 'halides':
        return "bg-accent/20 text-accent border-accent/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

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
            <Badge variant="outline" className={`${getCategoryColor(category)} font-medium text-xs py-1 px-2 shadow-sm`}>
              {category}
            </Badge>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      
      <CardContent className="p-4">
        <CardTitle className="text-lg font-semibold line-clamp-1 mb-1">{title}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground line-clamp-2">
          {description}
        </CardDescription>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 text-xs text-muted-foreground">
        Click to view details
      </CardFooter>
    </Card>
  );
}

export default RockMineralsCard;
