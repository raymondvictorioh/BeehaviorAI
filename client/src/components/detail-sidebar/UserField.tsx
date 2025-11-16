import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DetailSidebarField } from "./DetailSidebarField";
import { getInitials, getDisplayName } from "@/lib/utils/userUtils";

interface UserFieldProps {
  /**
   * Field label (e.g., "Logged By", "Created By", "Assigned To")
   */
  label: string;

  /**
   * User object with optional firstName, lastName, and email
   */
  user?:
    | {
        firstName?: string | null;
        lastName?: string | null;
        email?: string | null;
      }
    | null;

  /**
   * Fallback email to display if user object is not available
   */
  fallbackEmail?: string;

  /**
   * Optional data-testid for testing
   * If not provided, auto-generated from label
   */
  testId?: string;
}

/**
 * UserField - Specialized field component for displaying user information with avatar.
 *
 * Displays an avatar with user initials and the user's display name.
 * Automatically handles fallback to email if name is not available.
 *
 * @example With user object
 * ```tsx
 * <UserField
 *   label="Logged By"
 *   user={log.loggedByUser}
 *   fallbackEmail={log.loggedBy}
 * />
 * ```
 *
 * @example With just email
 * ```tsx
 * <UserField
 *   label="Created By"
 *   fallbackEmail="user@example.com"
 * />
 * ```
 */
export function UserField({
  label,
  user,
  fallbackEmail,
  testId,
}: UserFieldProps) {
  return (
    <DetailSidebarField label={label} testId={testId}>
      <div className="flex items-center gap-2">
        <Avatar className="h-7 w-7">
          <AvatarFallback className="text-xs">
            {getInitials(user?.firstName, user?.lastName, user?.email)}
          </AvatarFallback>
        </Avatar>
        <span>{getDisplayName(user, fallbackEmail || "Unknown")}</span>
      </div>
    </DetailSidebarField>
  );
}
