import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { BehaviorLogDetailsContent } from "@/components/BehaviorLogDetailsContent";
import type { BehaviorLogCategory } from "@shared/schema";
import type { BehaviorLogWithUser } from "@/lib/utils/userUtils";

interface BehaviorLogSidebarRightProps {
  log: BehaviorLogWithUser;
  category: BehaviorLogCategory | undefined;
  onDelete: () => void;
}

/**
 * @deprecated Use DetailSidebar with composition instead.
 *
 * This component will be removed in a future version.
 *
 * Migration example:
 * ```tsx
 * // Old (deprecated):
 * <BehaviorLogSidebarRight log={log} category={category} onDelete={onDelete} />
 *
 * // New (recommended):
 * import { DetailSidebar, DetailSidebarSection, DetailSidebarField } from "@/components/detail-sidebar";
 *
 * <DetailSidebar title="Details">
 *   <DetailSidebarSection>
 *     {/* Category badge, fields, actions *\/}
 *   </DetailSidebarSection>
 * </DetailSidebar>
 * ```
 *
 * @see client/src/components/detail-sidebar
 * @see client/src/pages/BehaviorLogDetail.tsx (for complete example)
 */
export function BehaviorLogSidebarRight({
  log,
  category,
  onDelete,
}: BehaviorLogSidebarRightProps) {
  return (
    <Sidebar
      side="right"
      className="hidden lg:flex"
    >
      <SidebarHeader className="h-16 flex items-center px-4 border-sidebar-border">
        <h2 className="text-lg font-semibold">Details</h2>
      </SidebarHeader>

      <SidebarContent className="p-6">
        <BehaviorLogDetailsContent
          log={log}
          category={category}
          onDelete={onDelete}
        />
      </SidebarContent>
    </Sidebar>
  );
}
