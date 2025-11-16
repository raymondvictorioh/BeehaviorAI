import { Calendar, LucideIcon } from "lucide-react";
import { DetailSidebarField } from "./DetailSidebarField";
import { formatDateTime } from "@/lib/utils/dateUtils";

interface DateFieldProps {
  /**
   * Field label (e.g., "Incident Date", "Logged At", "Assessment Date")
   */
  label: string;

  /**
   * Date value to display (string or Date object)
   */
  date: string | Date | null | undefined;

  /**
   * Optional icon to display (defaults to Calendar)
   */
  icon?: LucideIcon;

  /**
   * Optional data-testid for testing
   * If not provided, auto-generated from label
   */
  testId?: string;
}

/**
 * DateField - Specialized field component for displaying formatted dates.
 *
 * Automatically formats dates using formatDateTime utility and displays
 * with a calendar icon by default.
 *
 * @example Basic usage
 * ```tsx
 * <DateField label="Incident Date" date={log.incidentDate} />
 * ```
 *
 * @example Custom icon
 * ```tsx
 * <DateField label="Logged At" date={log.loggedAt} icon={Clock} />
 * ```
 *
 * @example Optional date
 * ```tsx
 * <DateField label="Due Date" date={task.dueDate} />
 * // Displays "N/A" if date is null/undefined
 * ```
 */
export function DateField({
  label,
  date,
  icon = Calendar,
  testId,
}: DateFieldProps) {
  return (
    <DetailSidebarField label={label} icon={icon} testId={testId}>
      {date ? formatDateTime(date) : "N/A"}
    </DetailSidebarField>
  );
}
