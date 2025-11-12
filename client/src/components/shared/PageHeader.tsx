import { ReactNode } from "react";

export interface PageHeaderProps {
  /** Main page title */
  title: string;
  /** Optional subtitle/description */
  description?: string;
  /** Optional action button or component (e.g., "Add Student" button) */
  action?: ReactNode;
  /** Optional test ID for the title element */
  titleTestId?: string;
}

/**
 * PageHeader - Reusable page header component
 *
 * Provides a consistent page header layout across all pages with optional action button.
 *
 * Features:
 * - Responsive layout (stacks on mobile, horizontal on desktop)
 * - Optional action button slot
 * - Consistent typography and spacing
 * - Test ID support for automated testing
 *
 * @example
 * ```tsx
 * // Simple header without action
 * <PageHeader
 *   title="Dashboard"
 *   description="Overview of student behavior management activities"
 * />
 *
 * // Header with action button
 * <PageHeader
 *   title="Students"
 *   description="Manage student profiles and behavior records"
 *   action={
 *     <Button onClick={() => setIsOpen(true)}>
 *       <Plus className="h-4 w-4 mr-2" />
 *       Add Student
 *     </Button>
 *   }
 * />
 * ```
 */
export function PageHeader({
  title,
  description,
  action,
  titleTestId = "text-page-title",
}: PageHeaderProps) {
  // If there's an action, use flex layout; otherwise use simple div
  const ContainerElement = action ? "div" : "div";
  const containerClassName = action
    ? "flex items-center justify-between gap-4 flex-wrap"
    : "";

  return (
    <ContainerElement className={containerClassName}>
      <div>
        <h1 className="text-3xl font-semibold mb-2" data-testid={titleTestId}>
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      {action && action}
    </ContainerElement>
  );
}
