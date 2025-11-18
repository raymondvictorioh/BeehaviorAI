import { RequestHandler } from "express";
import { storage } from "../storage";

/**
 * Middleware to check if the authenticated user has one of the required roles
 * for the current organization.
 *
 * Must be used after isAuthenticated and checkOrganizationAccess middleware.
 *
 * @param allowedRoles - Array of roles that are allowed to access this route (e.g., ["admin", "teacher"])
 * @returns Express middleware function
 *
 * @example
 * app.post(
 *   "/api/organizations/:orgId/invitations",
 *   isAuthenticated,
 *   checkOrganizationAccess,
 *   requireRole(["admin"]), // Only admins can invite users
 *   async (req, res) => { ... }
 * );
 */
export function requireRole(allowedRoles: string[]): RequestHandler {
  return async (req: any, res, next) => {
    try {
      const userId = req.session?.supabaseUserId;
      const orgId = req.params.orgId || req.params.id;

      if (!userId) {
        return res.status(401).json({
          message: "Authentication required",
        });
      }

      if (!orgId) {
        return res.status(400).json({
          message: "Organization ID is required",
        });
      }

      // Get user's role in this organization
      const userRole = await storage.getUserRole(userId, orgId);

      if (!userRole) {
        return res.status(403).json({
          message: "You are not a member of this organization",
        });
      }

      // Check if user's role is in the allowed roles list
      if (!allowedRoles.includes(userRole.role)) {
        return res.status(403).json({
          message: `Insufficient permissions. Required role: ${allowedRoles.join(" or ")}`,
        });
      }

      // Attach user role to request for use in route handlers
      req.userRole = userRole.role;

      next();
    } catch (error) {
      console.error("Role check error:", error);
      res.status(500).json({
        message: "Failed to verify user permissions",
      });
    }
  };
}
