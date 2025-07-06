import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  onSearch: (searchTerm: string) => void;
  initialValue?: string;
  placeholder?: string;
  className?: string;
  debounceTime?: number;
  autoFocus?: boolean;
}

export function SearchBar({ 
  onSearch, 
  initialValue = "", 
  placeholder = "Search rocks and minerals...",
  className,
  debounceTime = 300,
  autoFocus = false
}: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const searchTimeout = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Apply initial value
  useEffect(() => {
    if (initialValue) {
      setSearchTerm(initialValue);
    }
  }, [initialValue]);

  // Apply search with debouncing
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    searchTimeout.current = window.setTimeout(() => {
      onSearch(searchTerm);
    }, debounceTime);
    
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchTerm, onSearch, debounceTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const clearSearch = () => {
    setSearchTerm('');
    onSearch('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className={cn(
        "relative flex w-full max-w-sm items-center", 
        isFocused && "ring-1 ring-primary ring-offset-0",
        className
      )}
    >
      <div className="relative w-full">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="search"
          placeholder={placeholder}
          className="w-full border-primary/20 pl-9 pr-10 py-5 text-sm shadow-sm focus-visible:ring-primary"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoFocus={autoFocus}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <Button 
        type="submit" 
        variant="secondary" 
        className="ml-2 hidden sm:block"
      >
        Search
      </Button>
    </form>
  );
}