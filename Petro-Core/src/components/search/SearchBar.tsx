import { Search } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  onSearch: (searchTerm: string) => void;
  initialValue?: string;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ 
  onSearch, 
  initialValue = "", 
  placeholder = "Search rocks and minerals...",
  className
}: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };
  
  return (
    <form onSubmit={handleSubmit} className={cn("flex w-full max-w-lg gap-2 items-center justify-center", className)}>
      <Input
        type="text"
        placeholder={placeholder}
        className="flex-1"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <Button type="submit" variant="default">
        <Search className="h-4 w-4 mr-2" />
        Search
      </Button>
    </form>
  );
}