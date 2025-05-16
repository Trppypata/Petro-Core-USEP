import { Search } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export function SearchBar() {
  return (
    <div className="flex w-full max-w-lg gap-2 items-center justify-center">
      <Input
        type="text"
        placeholder=""
        className="flex-1"
      />
      <Button variant="default">
        <Search className="h-4 w-4 mr-2" />
        Search
      </Button>
    </div>
  );
}