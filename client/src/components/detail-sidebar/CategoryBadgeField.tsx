import { Badge } from "@/components/ui/badge";
import { DetailSidebarField } from "./DetailSidebarField";

interface CategoryBadgeFieldProps {
  /**
   * Field label (e.g., "Category", "Type", "Classification")
   */
  label?: string;

  /**
   * Category object with name and optional color
   */
  category?:
    | {
        name: string;
        color?: string | null;
      }
    | null;

  /**
   * Optional function to convert color string to Tailwind class
   * (e.g., getLegacyBehaviorColor, getAcademicColor)
   */
  getColor?: (color: string) => string;

  /**
   * Optional data-testid for testing
   */
  testId?: string;
}

/**
 * CategoryBadgeField - Specialized component for displaying category badges with colored dots.
 *
 * Shows a colored circle indicator next to a category badge with an optional label.
 * Commonly used for behavior log categories, academic log categories, etc.
 *
 * @example With label and color function
 * ```tsx
 * <CategoryBadgeField
 *   label="Category"
 *   category={category}
 *   getColor={getLegacyBehaviorColor}
 *   testId="text-detail-category"
 * />
 * ```
 *
 * @example Without label (old behavior)
 * ```tsx
 * <CategoryBadgeField
 *   category={category}
 *   getColor={getLegacyBehaviorColor}
 * />
 * ```
 */
export function CategoryBadgeField({
  label,
  category,
  getColor,
  testId,
}: CategoryBadgeFieldProps) {
  const colorClass =
    category?.color && getColor
      ? getColor(category.color)
      : "bg-gray-500";

  const content = (
    <div className="flex items-center gap-2">
      <div className={`h-3 w-3 rounded-full ${colorClass}`} />
      <Badge variant="secondary" className="text-xs" data-testid={testId}>
        {category?.name || "Unknown"}
      </Badge>
    </div>
  );

  // If label is provided, wrap with DetailSidebarField
  if (label) {
    return (
      <DetailSidebarField label={label} testId={testId}>
        {content}
      </DetailSidebarField>
    );
  }

  // Otherwise, return content directly (backward compatibility)
  return content;
}
