import { useState } from "react";
import { Check, ChevronsUpDown, User } from "lucide-react";
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

  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ["/api/organizations", organizationId, "students"],
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
          className="w-full justify-between"
          data-testid="student-selector-trigger"
        >
          {selectedStudent ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {getInitials(selectedStudent.name)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">
                {selectedStudent.name}
                {selectedStudent.email && (
                  <span className="text-muted-foreground ml-1">
                    ({selectedStudent.email})
                  </span>
                )}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">
              Select student{required && " *"}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search students by name or email..." />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Loading students..." : "No students found."}
            </CommandEmpty>
            <CommandGroup>
              {students.map((student) => (
                <CommandItem
                  key={student.id}
                  value={`${student.name} ${student.email || ""}`}
                  onSelect={() => {
                    onChange(student.id);
                    setOpen(false);
                  }}
                  data-testid={`student-option-${student.id}`}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === student.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarFallback className="text-xs">
                      {getInitials(student.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium">{student.name}</span>
                    {student.email && (
                      <span className="text-xs text-muted-foreground">
                        {student.email}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
