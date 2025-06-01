import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";

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
    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-[200px] flex flex-col">
      <CardHeader className="flex-grow">
        <CardTitle className="text-xl mb-2">{title}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground line-clamp-4">
          {truncatedDescription}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}