import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useDebounce } from "@uidotdev/usehooks";

import { Input } from "@/core/components/input";
import { TooltipButton } from "@/core/components/tooltip-button";

interface SearchInputProps {
  onSearch: (searchTerm: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  onSearch,
  placeholder = "Search",
  className = "",
}: SearchInputProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    onSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, onSearch]);

  const handleClear = () => {
    setSearchTerm("");
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <div className="absolute left-3 text-muted-foreground">
        <Search className="h-4 w-4" />
      </div>
      <Input
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full pl-9 pr-9"
      />
      {searchTerm && (
        <TooltipButton
          variant="ghost"
          size="icon"
          className="absolute right-1 h-7 w-7"
          onClick={handleClear}
          tooltipContent="Clear search"
        >
          <X className="h-4 w-4" />
        </TooltipButton>
      )}
    </div>
  );
}
