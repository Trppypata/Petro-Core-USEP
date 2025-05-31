import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { SupabaseImage } from "../ui/supabase-image";

interface WorkCardProps {
  title: string;
  description: string;
  imageUrl?: string; // Optional image URL
}

export function RockMineralsCard({ title, description, imageUrl }: WorkCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <div className="h-40 rounded-t-lg overflow-hidden">
        <SupabaseImage
          src={imageUrl}
          alt={title}
          height={160}
          width="100%"
          objectFit="cover"
          className="w-full h-full"
        />
      </div>
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
