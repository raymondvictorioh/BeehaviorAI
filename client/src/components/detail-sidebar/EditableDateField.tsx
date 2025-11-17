import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon, Pencil, Check, X } from "lucide-react";
import { DetailSidebarField } from "./DetailSidebarField";
import { formatDateTime } from "@/lib/utils/dateUtils";

interface EditableDateFieldProps {
  /**
   * Field label (e.g., "Incident Date", "Due Date")
   */
  label: string;

  /**
   * Current date value
   */
  date: string | Date | null | undefined;

  /**
   * Callback when date is updated
   */
  onUpdate: (date: Date) => void;

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
 * EditableDateField - Editable date field with inline editing.
 *
 * Shows a formatted date that can be edited by clicking. Opens a popover
 * with a native datetime-local input. Shows an edit icon on hover.
 *
 * @example
 * ```tsx
 * <EditableDateField
 *   label="Incident Date"
 *   date={log.incidentDate}
 *   onUpdate={handleUpdateDate}
 *   isUpdating={mutation.isPending}
 * />
 * ```
 */
export function EditableDateField({
  label,
  date,
  onUpdate,
  isUpdating = false,
  testId,
}: EditableDateFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [tempDate, setTempDate] = useState<string>("");

  // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
  const formatDateForInput = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && date) {
      // Initialize temp date when opening
      setTempDate(formatDateForInput(new Date(date)));
    }
  };

  const handleSave = () => {
    if (tempDate) {
      onUpdate(new Date(tempDate));
      setIsOpen(false);
    }
  };

  const handleCancel = () => {
    setTempDate("");
    setIsOpen(false);
  };

  return (
    <DetailSidebarField
      label={label}
      icon={CalendarIcon}
      testId={testId}
      className="hover:bg-accent/50 rounded px-2 py-1 -mx-2 -my-1 -ml-6 pl-6 transition-colors cursor-pointer group"
    >
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <div
            className="flex items-center gap-2 flex-1"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <span className="text-sm flex-1">
              {date ? formatDateTime(date) : "N/A"}
            </span>
            {isHovered && !isUpdating && (
              <Pencil className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="start">
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date & Time</label>
              <Input
                type="datetime-local"
                value={tempDate}
                onChange={(e) => setTempDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!tempDate}>
                <Check className="h-4 w-4 mr-1" />
                Save
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </DetailSidebarField>
  );
}
