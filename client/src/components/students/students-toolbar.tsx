import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StudentsToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedClass: string;
  onClassChange: (value: string) => void;
  classes: Array<{ id: string; name: string }>;
}

export function StudentsToolbar({
  searchQuery,
  onSearchChange,
  selectedClass,
  onClassChange,
  classes,
}: StudentsToolbarProps) {
  const isFiltered = searchQuery !== "" || selectedClass !== "all";

  const handleReset = () => {
    onSearchChange("");
    onClassChange("all");
  };

  return (
    <div className="flex flex-col gap-4 bg-card border rounded-md p-4">
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search students..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
          data-testid="input-search-students"
        />
        {classes.length > 0 && (
          <Select value={selectedClass} onValueChange={onClassChange}>
            <SelectTrigger className="h-8 w-[150px] lg:w-[200px]">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={handleReset}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
