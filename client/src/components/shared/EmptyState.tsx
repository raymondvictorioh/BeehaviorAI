import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface EmptyStateProps {
  /** Icon component to display */
  icon?: LucideIcon;
  /** Main title text */
  title: string;
  /** Description text */
  description?: string;
  /** Optional action button configuration */
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  /** Use Card wrapper (default: true) */
  useCard?: boolean;
  /** Test ID for automated testing */
  testId?: string;
}

/**
 * EmptyState - Reusable empty state component
 *
 * Provides a consistent empty state display across the application
 * for when there's no data to show.
 *
 * Features:
 * - Optional icon display
 * - Title and description text
 * - Optional action button
 * - Card or plain wrapper
 * - Centered layout
 *
 * @example
 * ```tsx
 * // With card wrapper
 * <EmptyState
 *   icon={Users}
 *   title="Welcome to Beehave!"
 *   description="Get started by adding students to your organization..."
 * />
 *
 * // With action button, no card
 * <EmptyState
 *   title="No students yet"
 *   description="Add your first student to get started."
 *   action={{
 *     label: "Add Student",
 *     onClick: () => setIsOpen(true),
 *     icon: Plus
 *   }}
 *   useCard={false}
 * />
 *
 * // No results state
 * <EmptyState
 *   title="No students found"
 *   description={`No students found matching "${searchQuery}"`}
 *   useCard={false}
 * />
 * ```
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  useCard = true,
  testId = "empty-state",
}: EmptyStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center py-12" data-testid={testId}>
      {Icon && <Icon className="h-12 w-12 text-muted-foreground mb-4" />}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground text-center max-w-md mb-4">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick}>
          {action.icon && <action.icon className="h-4 w-4 mr-2" />}
          {action.label}
        </Button>
      )}
    </div>
  );

  if (useCard) {
    return (
      <Card>
        <CardContent className="p-0">{content}</CardContent>
      </Card>
    );
  }

  return content;
}
