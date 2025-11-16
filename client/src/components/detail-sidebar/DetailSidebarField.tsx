import { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { LucideIcon } from "lucide-react";

interface DetailSidebarFieldProps {
  /**
   * Field label (e.g., "Incident Date", "Logged By", "Status")
   */
  label: string;

  /**
   * Field value or content.
   * Can be plain text, formatted dates, or custom components (avatars, badges, etc.)
   */
  children: ReactNode;

  /**
   * Optional icon to display before the value.
   * Common icons: Calendar, Clock, User, etc.
   */
  icon?: LucideIcon;

  /**
   * Optional data-testid for testing.
   */
  testId?: string;

  /**
   * Optional className for the value container.
   */
  className?: string;
}

/**
 * DetailSidebarField - A labeled metadata field for DetailSidebar.
 *
 * Displays a label (in muted text) and a value below it.
 * Optionally includes an icon before the value.
 *
 * @example Simple text field
 * ```tsx
 * <DetailSidebarField label="Status">
 *   {log.status}
 * </DetailSidebarField>
 * ```
 *
 * @example Field with icon
 * ```tsx
 * <DetailSidebarField label="Incident Date" icon={Calendar}>
 *   {formatDateTime(log.incidentDate)}
 * </DetailSidebarField>
 * ```
 *
 * @example Field with custom content (avatar)
 * ```tsx
 * <DetailSidebarField label="Logged By">
 *   <div className="flex items-center gap-2">
 *     <Avatar><AvatarFallback>JD</AvatarFallback></Avatar>
 *     <span>John Doe</span>
 *   </div>
 * </DetailSidebarField>
 * ```
 */
export function DetailSidebarField({
  label,
  children,
  icon: Icon,
  testId,
  className = "",
}: DetailSidebarFieldProps) {
  // Auto-generate testId from label if not provided
  const finalTestId =
    testId || `text-detail-${label.toLowerCase().replace(/\s+/g, "-")}`;

  // Use span for simple content, div for complex content (to avoid invalid HTML nesting)
  const isSimpleContent =
    typeof children === "string" || typeof children === "number";

  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className={`flex items-center gap-2 mt-1 ${className}`}>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        {isSimpleContent ? (
          <span className="text-sm" data-testid={finalTestId}>
            {children}
          </span>
        ) : (
          <div className="text-sm" data-testid={finalTestId}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
