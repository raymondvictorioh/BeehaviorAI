import { ReactNode } from "react";
import { Separator } from "@/components/ui/separator";

interface DetailSidebarSectionProps {
  /**
   * Section content (fields, badges, custom components, etc.)
   */
  children: ReactNode;

  /**
   * Show a separator line above this section.
   * Useful for visually dividing metadata, actions, and other content.
   * @default false
   */
  withSeparator?: boolean;

  /**
   * Optional className to apply to the section container.
   */
  className?: string;
}

/**
 * DetailSidebarSection - A reusable section container for DetailSidebar.
 *
 * Use this to group related fields or content within the sidebar.
 * Sections can optionally have a separator line above them for visual separation.
 *
 * @example Basic section
 * ```tsx
 * <DetailSidebarSection>
 *   <DetailSidebarField label="Date">{date}</DetailSidebarField>
 *   <DetailSidebarField label="Status">{status}</DetailSidebarField>
 * </DetailSidebarSection>
 * ```
 *
 * @example Section with separator
 * ```tsx
 * <DetailSidebarSection withSeparator>
 *   <DetailSidebarActions>
 *     <Button>Delete</Button>
 *   </DetailSidebarActions>
 * </DetailSidebarSection>
 * ```
 */
export function DetailSidebarSection({
  children,
  className = "",
}: DetailSidebarSectionProps) {
  return (
    <>
      <div className={`space-y-3 ${className}`}>{children}</div>
    </>
  );
}
