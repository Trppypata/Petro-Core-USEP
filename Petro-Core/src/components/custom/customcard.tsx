import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";

interface WorkCardProps {
  title: string;
  description: string;
  imageUrl?: string; // Optional image URL
}

export function RockMineralsCard({ title, description, imageUrl }: WorkCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      {imageUrl && (
        <div className="h-40 overflow-hidden rounded-t-lg">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {description}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

export default RockMineralsCard;
