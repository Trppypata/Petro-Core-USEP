import { Card, CardDescription, CardHeader, CardTitle, CardContent, CardFooter } from "../ui/card";
import { BookOpenIcon } from "lucide-react";

interface WorkCardProps {
  title: string;
  description: string;
}

export function WorkCard({ title, description }: WorkCardProps) {
  // Truncate description to ensure similar heights
  const truncatedDescription = description.length > 120 
    ? description.substring(0, 120) + '...' 
    : description;

  return (
    <Card className="overflow-hidden h-full group border-muted shadow-sm hover:shadow-md transition-all duration-200 bg-card">
      <div className="relative h-36 bg-primary/10 flex items-center justify-center overflow-hidden">
        <BookOpenIcon className="h-16 w-16 text-primary/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      
      <CardContent className="p-4">
        <CardTitle className="text-lg font-semibold line-clamp-1 mb-2">{title}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground line-clamp-3">
          {truncatedDescription}
        </CardDescription>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 text-xs text-muted-foreground">
        Click to explore
      </CardFooter>
    </Card>
  );
}