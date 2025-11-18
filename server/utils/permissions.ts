/**
 * Permission System for BeehaviorAI
 *
 * Defines what actions each role can perform on different resource types.
 * Used for both backend authorization and frontend UI visibility.
 *
 * Roles: admin, teacher, staff
 *
 * Permission levels:
 * - all: Full access to everything
 * - create: Can create new resources
 * - edit: Can modify existing resources
 * - delete: Can delete resources
 * - view_all: Can view all resources in organization
 * - view_assigned: Can view only assigned resources
 * - none: No access
 */

export type Role = "admin" | "teacher" | "staff";
export type Action = "create" | "edit" | "delete" | "view_all" | "view_assigned";
export type ResourceType =
  | "students"
  | "behavior_logs"
  | "academic_logs"
  | "meetings"
  | "tasks"
  | "categories"
  | "classes"
  | "subjects"
  | "users"
  | "invitations"
  | "organization_settings";

/**
 * Permission matrix defining what each role can do
 */
export const PERMISSIONS: Record<Role, Record<ResourceType, Record<Action, boolean>>> = {
  admin: {
    // Admins have full access to everything
    students: { create: true, edit: true, delete: true, view_all: true, view_assigned: true },
    behavior_logs: { create: true, edit: true, delete: true, view_all: true, view_assigned: true },
    academic_logs: { create: true, edit: true, delete: true, view_all: true, view_assigned: true },
    meetings: { create: true, edit: true, delete: true, view_all: true, view_assigned: true },
    tasks: { create: true, edit: true, delete: true, view_all: true, view_assigned: true },
    categories: { create: true, edit: true, delete: true, view_all: true, view_assigned: true },
    classes: { create: true, edit: true, delete: true, view_all: true, view_assigned: true },
    subjects: { create: true, edit: true, delete: true, view_all: true, view_assigned: true },
    users: { create: true, edit: true, delete: true, view_all: true, view_assigned: true },
    invitations: { create: true, edit: true, delete: true, view_all: true, view_assigned: true },
    organization_settings: { create: true, edit: true, delete: true, view_all: true, view_assigned: true },
  },

  teacher: {
    // Teachers can manage students and create logs/meetings/tasks
    students: { create: true, edit: true, delete: false, view_all: true, view_assigned: true },
    behavior_logs: { create: true, edit: true, delete: true, view_all: false, view_assigned: true },
    academic_logs: { create: true, edit: true, delete: true, view_all: false, view_assigned: true },
    meetings: { create: true, edit: true, delete: true, view_all: false, view_assigned: true },
    tasks: { create: true, edit: true, delete: true, view_all: false, view_assigned: true },
    categories: { create: false, edit: false, delete: false, view_all: true, view_assigned: true },
    classes: { create: false, edit: false, delete: false, view_all: true, view_assigned: true },
    subjects: { create: false, edit: false, delete: false, view_all: true, view_assigned: true },
    users: { create: false, edit: false, delete: false, view_all: true, view_assigned: true },
    invitations: { create: false, edit: false, delete: false, view_all: false, view_assigned: false },
    organization_settings: { create: false, edit: false, delete: false, view_all: false, view_assigned: false },
  },

  staff: {
    // Staff has read-only access to most things
    students: { create: false, edit: false, delete: false, view_all: true, view_assigned: true },
    behavior_logs: { create: false, edit: false, delete: false, view_all: true, view_assigned: true },
    academic_logs: { create: false, edit: false, delete: false, view_all: true, view_assigned: true },
    meetings: { create: false, edit: false, delete: false, view_all: true, view_assigned: true },
    tasks: { create: false, edit: false, delete: false, view_all: true, view_assigned: true },
    categories: { create: false, edit: false, delete: false, view_all: true, view_assigned: true },
    classes: { create: false, edit: false, delete: false, view_all: true, view_assigned: true },
    subjects: { create: false, edit: false, delete: false, view_all: true, view_assigned: true },
    users: { create: false, edit: false, delete: false, view_all: true, view_assigned: true },
    invitations: { create: false, edit: false, delete: false, view_all: false, view_assigned: false },
    organization_settings: { create: false, edit: false, delete: false, view_all: false, view_assigned: false },
  },
};

/**
 * Check if a role has permission to perform an action on a resource type
 *
 * @param role - User's role (admin, teacher, staff)
 * @param action - Action to check (create, edit, delete, view_all, view_assigned)
 * @param resourceType - Type of resource (students, behavior_logs, etc.)
 * @returns boolean - true if user has permission, false otherwise
 *
 * @example
 * hasPermission("teacher", "create", "students"); // true
 * hasPermission("staff", "delete", "behavior_logs"); // false
 * hasPermission("admin", "view_all", "organization_settings"); // true
 */
export function hasPermission(
  role: Role,
  action: Action,
  resourceType: ResourceType
): boolean {
  const rolePermissions = PERMISSIONS[role];

  if (!rolePermissions) {
    return false;
  }

  const resourcePermissions = rolePermissions[resourceType];

  if (!resourcePermissions) {
    return false;
  }

  return resourcePermissions[action] ?? false;
}

/**
 * Check if a role can view a specific resource
 * Combines view_all and view_assigned permissions
 *
 * @param role - User's role
 * @param resourceType - Type of resource
 * @param isAssigned - Whether the resource is assigned to the user (optional)
 * @returns boolean - true if user can view this resource
 *
 * @example
 * canView("admin", "students"); // true (can view all)
 * canView("teacher", "behavior_logs", true); // true (can view assigned)
 * canView("teacher", "behavior_logs", false); // false (can't view all)
 * canView("staff", "students"); // true (can view all)
 */
export function canView(
  role: Role,
  resourceType: ResourceType,
  isAssigned?: boolean
): boolean {
  if (hasPermission(role, "view_all", resourceType)) {
    return true;
  }

  if (isAssigned && hasPermission(role, "view_assigned", resourceType)) {
    return true;
  }

  return false;
}

/**
 * Get all permissions for a specific role
 *
 * @param role - User's role
 * @returns Object containing all permissions for this role
 */
export function getRolePermissions(role: Role): Record<ResourceType, Record<Action, boolean>> {
  return PERMISSIONS[role];
}

/**
 * Check if a role is considered an admin-level role
 *
 * @param role - User's role
 * @returns boolean - true if role is admin
 */
export function isAdminRole(role: Role): boolean {
  return role === "admin";
}

/**
 * Check if a role can manage organization settings
 *
 * @param role - User's role
 * @returns boolean - true if role can manage settings
 */
export function canManageOrganization(role: Role): boolean {
  return hasPermission(role, "edit", "organization_settings");
}

/**
 * Check if a role can invite users
 *
 * @param role - User's role
 * @returns boolean - true if role can create invitations
 */
export function canInviteUsers(role: Role): boolean {
  return hasPermission(role, "create", "invitations");
}
