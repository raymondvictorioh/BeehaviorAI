import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Search, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Student } from "@shared/schema";

interface StudentSelectorProps {
  organizationId: string;
  value?: string;
  onChange: (studentId: string) => void;
  required?: boolean;
}

export function StudentSelector({
  organizationId,
  value,
  onChange,
  required = false,
}: StudentSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch students with server-side search
  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ["/api/organizations", organizationId, "students", debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) {
        params.append("search", debouncedSearch);
      }
      const res = await fetch(
        `/api/organizations/${organizationId}/students?${params.toString()}`
      );
      if (!res.ok) throw new Error("Failed to fetch students");
      return res.json();
    },
    enabled: !!organizationId,
  });

  const selectedStudent = students.find((student) => student.id === value);

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-10 px-3"
          data-testid="student-selector-trigger"
        >
          {selectedStudent ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {getInitials(selectedStudent.name)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate font-medium">
                {selectedStudent.name}
              </span>
              {selectedStudent.email && (
                <span className="text-muted-foreground text-sm truncate ml-auto">
                  {selectedStudent.email}
                </span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground font-normal">
              Select student{required && " *"}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[500px] p-0 shadow-lg"
        align="start"
        sideOffset={4}
      >
        <Command shouldFilter={false} className="rounded-lg border-0">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="Search students by name or email..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0"
            />
            {isLoading && (
              <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
            )}
          </div>
          <CommandList className="max-h-[300px] overflow-y-auto">
            <CommandEmpty className="py-6 text-center text-sm">
              {isLoading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="text-muted-foreground">Searching students...</span>
                </div>
              ) : debouncedSearch ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="rounded-full bg-muted p-3">
                    <Search className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">No students found</p>
                    <p className="text-muted-foreground">
                      No matches for "{debouncedSearch}"
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="rounded-full bg-muted p-3">
                    <Search className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">Start searching</p>
                    <p className="text-muted-foreground">
                      Type to search for students
                    </p>
                  </div>
                </div>
              )}
            </CommandEmpty>
            <CommandGroup className="p-2">
              {students.map((student) => (
                <CommandItem
                  key={student.id}
                  value={`${student.name} ${student.email || ""}`}
                  onSelect={() => {
                    onChange(student.id);
                    setOpen(false);
                  }}
                  data-testid={`student-option-${student.id}`}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-md cursor-pointer transition-colors",
                    "hover:bg-accent aria-selected:bg-accent",
                    value === student.id && "bg-accent/50"
                  )}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="text-sm font-medium">
                        {getInitials(student.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center justify-between flex-1 min-w-0 gap-4">
                      <span className="font-medium truncate">{student.name}</span>
                      {student.email && (
                        <span className="text-sm text-muted-foreground truncate">
                          {student.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0 text-primary",
                      value === student.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
