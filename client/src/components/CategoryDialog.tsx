import type { BehaviorLogCategory } from "@shared/schema";
import { BaseCategoryDialog, CategoryDialogConfig, CategoryData } from "./shared/BaseCategoryDialog";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; description: string | null; color: string | null; displayOrder: number }) => Promise<void>;
  category?: BehaviorLogCategory | null;
  isPending?: boolean;
}

/**
 * Behavior log category dialog configuration
 */
const BEHAVIOR_CATEGORY_CONFIG: CategoryDialogConfig = {
  createTitle: "Add Category",
  editTitle: "Edit Category",
  createDescription: "Create a new behavior log category",
  editDescription: "Update the behavior log category details",
  namePlaceholder: "e.g., Positive, Neutral, Concern",
  descriptionPlaceholder: "Describe what this category is used for...",
};

/**
 * CategoryDialog - Wrapper for behavior log categories
 *
 * Provides a dialog for creating and editing behavior log categories.
 * Uses BaseCategoryDialog template with behavior-specific configuration.
 *
 * @example
 * ```tsx
 * <CategoryDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onSubmit={handleCreateCategory}
 *   isPending={mutation.isPending}
 * />
 *
 * // Edit mode
 * <CategoryDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onSubmit={handleUpdateCategory}
 *   category={selectedCategory}
 *   isPending={mutation.isPending}
 * />
 * ```
 */
export function CategoryDialog({
  open,
  onOpenChange,
  onSubmit,
  category,
  isPending = false,
}: CategoryDialogProps) {
  return (
    <BaseCategoryDialog
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={onSubmit}
      category={category as CategoryData | null}
      isPending={isPending}
      config={BEHAVIOR_CATEGORY_CONFIG}
    />
  );
}
