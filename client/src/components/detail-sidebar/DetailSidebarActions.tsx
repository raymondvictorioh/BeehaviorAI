import { ReactNode } from "react";

interface DetailSidebarActionsProps {
  /**
   * Action buttons (Edit, Delete, Archive, etc.)
   * Typically Button components with appropriate variants.
   */
  children: ReactNode;

  /**
   * Optional className for the actions container.
   */
  className?: string;
}

/**
 * DetailSidebarActions - A container for action buttons in DetailSidebar.
 *
 * Use this to group action buttons (Edit, Delete, Archive, etc.) at the bottom
 * of the sidebar or within a section.
 *
 * Provides consistent spacing between multiple action buttons.
 *
 * @example Single action
 * ```tsx
 * <DetailSidebarActions>
 *   <Button variant="outline" onClick={onDelete} className="w-full text-destructive">
 *     <Trash2 className="h-4 w-4 mr-2" />
 *     Delete Log
 *   </Button>
 * </DetailSidebarActions>
 * ```
 *
 * @example Multiple actions
 * ```tsx
 * <DetailSidebarActions>
 *   <Button variant="outline" onClick={onEdit} className="w-full">
 *     <Edit className="h-4 w-4 mr-2" />
 *     Edit
 *   </Button>
 *   <Button variant="outline" onClick={onDelete} className="w-full text-destructive">
 *     <Trash2 className="h-4 w-4 mr-2" />
 *     Delete
 *   </Button>
 * </DetailSidebarActions>
 * ```
 */
export function DetailSidebarActions({
  children,
  className = "",
}: DetailSidebarActionsProps) {
  return <div className={`space-y-2 ${className}`}>{children}</div>;
}
