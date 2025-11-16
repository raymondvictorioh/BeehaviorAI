import type { BehaviorLog } from "@shared/schema";

/**
 * Extended BehaviorLog type with user details populated from join
 */
export type BehaviorLogWithUser = BehaviorLog & {
  loggedByUser?: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
  } | null;
};

/**
 * Generate user initials from first name, last name, or email
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @param email - User's email address
 * @returns Two-character initials in uppercase, or "UN" if no data available
 */
export function getInitials(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  email: string | null | undefined
): string {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (firstName) {
    return firstName.substring(0, 2).toUpperCase();
  }
  if (email) {
    return email.substring(0, 2).toUpperCase();
  }
  return "UN";
}

/**
 * Get display name for a user, with fallback chain
 * @param userObj - User object with firstName, lastName, and email
 * @param fallbackEmail - Fallback email if userObj is null/undefined
 * @returns Display name (full name preferred, then parts, then email, then fallback)
 */
export function getDisplayName(
  userObj: { firstName: string | null; lastName: string | null; email: string | null } | null | undefined,
  fallbackEmail: string
): string {
  if (userObj?.firstName && userObj?.lastName) {
    return `${userObj.firstName} ${userObj.lastName}`;
  }
  if (userObj?.firstName) return userObj.firstName;
  if (userObj?.lastName) return userObj.lastName;
  if (userObj?.email) return userObj.email;
  return fallbackEmail || "Unknown";
}
