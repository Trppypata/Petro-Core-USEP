import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";

interface WorkCardProps {
  title: string;
  description: string;
}

export function WorkCard({ title, description }: WorkCardProps) {

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {description}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}