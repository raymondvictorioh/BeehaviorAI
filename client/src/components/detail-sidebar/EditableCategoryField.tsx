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

interface EditableCategoryFieldProps {
  /**
   * Field label (e.g., "Category", "Type")
   */
  label: string;

  /**
   * Current category object
   */
  category?:
    | {
        id: string;
        name: string;
        color?: string | null;
      }
    | null;

  /**
   * List of all available categories to choose from
   */
  categories: Array<{
    id: string;
    name: string;
    color?: string | null;
  }>;

  /**
   * Optional function to convert color string to Tailwind class
   * (e.g., getLegacyBehaviorColor, getAcademicColor)
   */
  getColor?: (color: string) => string;

  /**
   * Callback when category is updated
   */
  onUpdate: (categoryId: string) => void;

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
 * EditableCategoryField - Editable category badge field with inline editing.
 *
 * Shows a category badge that can be edited by clicking. Opens a popover
 * with a list of all available categories. Shows an edit icon on hover.
 *
 * @example
 * ```tsx
 * <EditableCategoryField
 *   label="Category"
 *   category={currentCategory}
 *   categories={allCategories}
 *   getColor={getLegacyBehaviorColor}
 *   onUpdate={handleUpdateCategory}
 *   isUpdating={mutation.isPending}
 * />
 * ```
 */
export function EditableCategoryField({
  label,
  category,
  categories,
  getColor,
  onUpdate,
  isUpdating = false,
  testId,
}: EditableCategoryFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleCategorySelect = (categoryId: string) => {
    onUpdate(categoryId);
    setIsOpen(false);
  };

  const colorClass =
    category?.color && getColor ? getColor(category.color) : "bg-gray-500";

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
            <div className={`h-3 w-3 rounded-full ${colorClass}`} />
            <Badge variant="secondary" className="text-xs">
              {category?.name || "Unknown"}
            </Badge>
            {isHovered && !isUpdating && (
              <Pencil className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          <div className="space-y-1">
            {categories.map((cat) => {
              const catColorClass =
                cat.color && getColor ? getColor(cat.color) : "bg-gray-500";
              const isSelected = cat.id === category?.id;

              return (
                <Button
                  key={cat.id}
                  variant={isSelected ? "secondary" : "ghost"}
                  className="w-full justify-start gap-2 h-9"
                  onClick={() => handleCategorySelect(cat.id)}
                >
                  <div className={`h-3 w-3 rounded-full ${catColorClass}`} />
                  <span className="flex-1 text-left">{cat.name}</span>
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
