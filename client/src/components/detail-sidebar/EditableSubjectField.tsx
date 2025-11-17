import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DetailSidebarField } from "./DetailSidebarField";
import { Pencil, Check } from "lucide-react";

interface EditableSubjectFieldProps {
  /**
   * Field label (e.g., "Subject")
   */
  label: string;

  /**
   * Current subject object
   */
  subject?:
    | {
        id: string;
        name: string;
        code?: string | null;
      }
    | null;

  /**
   * List of all available subjects to choose from
   */
  subjects: Array<{
    id: string;
    name: string;
    code?: string | null;
    isArchived?: boolean;
  }>;

  /**
   * Callback when subject is updated
   */
  onUpdate: (subjectId: string) => void;

  /**
   * Whether the update is currently in progress
   */
  isUpdating?: boolean;

  /**
   * Optional data-testid for testing
   */
  testId?: string;
}

/**
 * EditableSubjectField - Editable subject field with inline editing.
 *
 * Shows a subject badge that can be edited by clicking. Opens a popover
 * with a list of all available subjects. Shows an edit icon on hover.
 * Filters out archived subjects from the selection list.
 *
 * @example
 * ```tsx
 * <EditableSubjectField
 *   label="Subject"
 *   subject={currentSubject}
 *   subjects={allSubjects}
 *   onUpdate={handleUpdateSubject}
 *   isUpdating={mutation.isPending}
 * />
 * ```
 */
export function EditableSubjectField({
  label,
  subject,
  subjects,
  onUpdate,
  isUpdating = false,
  testId,
}: EditableSubjectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleSubjectSelect = (subjectId: string) => {
    onUpdate(subjectId);
    setIsOpen(false);
  };

  // Filter out archived subjects
  const activeSubjects = subjects.filter((s) => !s.isArchived);

  return (
    <DetailSidebarField
      label={label}
      testId={testId}
      className="hover:bg-accent/50 rounded px-2 py-1 -mx-2 -my-1 transition-colors cursor-pointer group"
    >
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div
            className="flex items-center gap-2 flex-1"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <Badge variant="secondary" className="text-xs">
              {subject?.name || "Unknown"}
              {subject?.code && (
                <span className="ml-1 text-muted-foreground">({subject.code})</span>
              )}
            </Badge>
            {isHovered && !isUpdating && (
              <Pencil className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          <div className="space-y-1">
            {activeSubjects.map((subj) => {
              const isSelected = subj.id === subject?.id;

              return (
                <Button
                  key={subj.id}
                  variant={isSelected ? "secondary" : "ghost"}
                  className="w-full justify-start gap-2 h-9"
                  onClick={() => handleSubjectSelect(subj.id)}
                >
                  <span className="flex-1 text-left">
                    {subj.name}
                    {subj.code && (
                      <span className="ml-1 text-muted-foreground text-xs">
                        ({subj.code})
                      </span>
                    )}
                  </span>
                  {isSelected && <Check className="h-4 w-4" />}
                </Button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </DetailSidebarField>
  );
}
