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
    if (!category) return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    
    switch (category.toLowerCase()) {
      case 'igneous':
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      case 'sedimentary':
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100";
      case 'metamorphic':
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case 'ore samples':
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100";
      case 'silicates':
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      case 'oxides':
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100";
      case 'sulfides':
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
      case 'native elements':
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100";
      case 'carbonates':
      case 'carbonates ':
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100";
      case 'halides':
        return "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    }
  };

  return (
    <Card className="overflow-hidden h-full group border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-200">
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
            <Badge className={`${getCategoryColor(category)} font-medium text-xs py-1 px-2 shadow-sm`}>
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
