import { ReactNode } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Link } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DetailSidebarProps {
  /**
   * Title displayed in the sidebar header.
   * @default "Details"
   */
  title?: string;

  /**
   * Content to display in the sidebar.
   * Use composition with DetailSidebarSection, DetailSidebarField, etc.
   */
  children: ReactNode;

  /**
   * Optional custom header content (overrides title and actions).
   * Use this if you need more than just a title in the header.
   */
  header?: ReactNode;

  /**
   * Show the "Copy URL" button in the header.
   * @default true
   */
  showCopyUrl?: boolean;

  /**
   * Optional className for the Sidebar wrapper.
   * @default "hidden lg:flex"
   */
  className?: string;
}

/**
 * DetailSidebar - A reusable right-hand sidebar for detail screens.
 *
 * This component provides a consistent layout for displaying metadata
 * and actions related to a specific record (behavior log, academic log, etc.).
 *
 * The sidebar is hidden on mobile (uses lg breakpoint) and shown as a fixed
 * right panel on desktop. Mobile layouts should use tabs or sheets instead.
 *
 * @example Basic usage
 * ```tsx
 * <DetailSidebar title="Details">
 *   <DetailSidebarSection>
 *     <DetailSidebarField label="Date" icon={Calendar}>
 *       {formatDateTime(log.date)}
 *     </DetailSidebarField>
 *   </DetailSidebarSection>
 * </DetailSidebar>
 * ```
 *
 * @example Custom title
 * ```tsx
 * <DetailSidebar title="Academic Details">
 *   <AcademicLogDetailsContent log={log} />
 * </DetailSidebar>
 * ```
 */
export function DetailSidebar({
  title = "Details",
  children,
  header,
  showCopyUrl = true,
  className = "hidden lg:flex",
}: DetailSidebarProps) {
  const { toast } = useToast();

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "The URL has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy the URL to clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <Sidebar side="right" className={className}>
      <SidebarHeader className="px-6 pt-4 pb-4 border-sidebar-border">
        {header || (
          <div className="flex items-center justify-between w-full">
            <h2 className="text-sm font-semibold">{title}</h2>
            {showCopyUrl && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyUrl}
                className="h-8 w-8"
                title="Copy URL"
              >
                <Link className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="p-6">{children}</SidebarContent>
    </Sidebar>
  );
}
