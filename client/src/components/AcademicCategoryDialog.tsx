import type { AcademicLogCategory } from "@shared/schema";
import { BaseCategoryDialog, CategoryDialogConfig, CategoryData } from "./shared/BaseCategoryDialog";

interface AcademicCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; description: string | null; color: string | null; displayOrder: number }) => Promise<void>;
  category?: AcademicLogCategory | null;
  isPending?: boolean;
}

/**
 * Academic log category dialog configuration
 */
const ACADEMIC_CATEGORY_CONFIG: CategoryDialogConfig = {
  createTitle: "Add Academic Category",
  editTitle: "Edit Academic Category",
  createDescription: "Create a new academic log category",
  editDescription: "Update the academic log category details",
  namePlaceholder: "e.g., Excellent, Good, Satisfactory",
  descriptionPlaceholder: "Describe this academic performance level...",
};

/**
 * AcademicCategoryDialog - Wrapper for academic log categories
 *
 * Provides a dialog for creating and editing academic log categories.
 * Uses BaseCategoryDialog template with academic-specific configuration.
 *
 * @example
 * ```tsx
 * <AcademicCategoryDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onSubmit={handleCreateCategory}
 *   isPending={mutation.isPending}
 * />
 *
 * // Edit mode
 * <AcademicCategoryDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onSubmit={handleUpdateCategory}
 *   category={selectedCategory}
 *   isPending={mutation.isPending}
 * />
 * ```
 */
export function AcademicCategoryDialog({
  open,
  onOpenChange,
  onSubmit,
  category,
  isPending = false,
}: AcademicCategoryDialogProps) {
  return (
    <BaseCategoryDialog
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={onSubmit}
      category={category as CategoryData | null}
      isPending={isPending}
      config={ACADEMIC_CATEGORY_CONFIG}
    />
  );
}
