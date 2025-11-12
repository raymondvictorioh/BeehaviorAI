import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SearchInputProps {
  /** Current search value */
  value: string;
  /** Callback when search value changes */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for automated testing */
  testId?: string;
}

/**
 * SearchInput - Reusable search input component
 *
 * Provides a consistent search input with icon across the application.
 *
 * Features:
 * - Search icon positioned on the left
 * - Customizable placeholder
 * - Controlled input component
 * - Support for additional CSS classes
 *
 * @example
 * ```tsx
 * const [searchQuery, setSearchQuery] = useState("");
 *
 * <SearchInput
 *   value={searchQuery}
 *   onChange={setSearchQuery}
 *   placeholder="Search students..."
 * />
 * ```
 */
export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className,
  testId = "input-search",
}: SearchInputProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9"
        data-testid={testId}
      />
    </div>
  );
}
