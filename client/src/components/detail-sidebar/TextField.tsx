import { LucideIcon } from "lucide-react";
import { DetailSidebarField } from "./DetailSidebarField";

interface TextFieldProps {
  /**
   * Field label (e.g., "Subject", "Grade", "Score", "Status")
   */
  label: string;

  /**
   * Text value to display
   */
  value: string | number | null | undefined;

  /**
   * Optional icon to display before the value
   */
  icon?: LucideIcon;

  /**
   * Optional data-testid for testing
   * If not provided, auto-generated from label
   */
  testId?: string;

  /**
   * Text to display when value is null/undefined
   * @default "N/A"
   */
  placeholder?: string;
}

/**
 * TextField - Specialized field component for displaying simple text values.
 *
 * Displays a text value with an optional icon. Shows a placeholder
 * if the value is null or undefined.
 *
 * @example Basic usage
 * ```tsx
 * <TextField label="Subject" value={subject?.name} />
 * ```
 *
 * @example With icon
 * ```tsx
 * <TextField label="Status" value={task.status} icon={Flag} />
 * ```
 *
 * @example With custom placeholder
 * ```tsx
 * <TextField label="Grade" value={log.grade} placeholder="Not graded" />
 * ```
 *
 * @example With number value
 * ```tsx
 * <TextField label="Score" value={log.score} />
 * ```
 */
export function TextField({
  label,
  value,
  icon,
  testId,
  placeholder = "N/A",
}: TextFieldProps) {
  return (
    <DetailSidebarField label={label} icon={icon} testId={testId}>
      {value ?? placeholder}
    </DetailSidebarField>
  );
}
