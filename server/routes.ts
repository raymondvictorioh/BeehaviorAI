import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, checkOrganizationAccess } from "./replitAuth";
import { getChatCompletion } from "./openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get user's organizations
      const organizations = await storage.getUserOrganizations(userId);

      res.json({ ...user, organizations });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Organization routes
  app.post("/api/organizations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, code, email, phone, address } = req.body;

      const organization = await storage.createOrganization({
        name,
        code,
        email,
        phone,
        address,
        ownerId: userId,
      });

      // Add user as owner in organization_users
      await storage.addUserToOrganization({
        userId,
        organizationId: organization.id,
        role: "owner",
      });

      res.json(organization);
    } catch (error) {
      console.error("Error creating organization:", error);
      res.status(500).json({ message: "Failed to create organization" });
    }
  });

  app.get("/api/organizations/:id/users", isAuthenticated, checkOrganizationAccess, async (req: any, res) => {
    try {
      const { id } = req.params;
      const users = await storage.getOrganizationUsers(id);
      res.json(users);
    } catch (error) {
      console.error("Error fetching organization users:", error);
      res.status(500).json({ message: "Failed to fetch organization users" });
    }
  });

  // Student routes
  app.get("/api/organizations/:orgId/students", isAuthenticated, checkOrganizationAccess, async (req: any, res) => {
    try {
      const { orgId } = req.params;
      const students = await storage.getStudents(orgId);
      res.json(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.post("/api/organizations/:orgId/students", isAuthenticated, checkOrganizationAccess, async (req: any, res) => {
    try {
      const { orgId } = req.params;
      const student = await storage.createStudent({
        ...req.body,
        organizationId: orgId,
      });
      res.json(student);
    } catch (error) {
      console.error("Error creating student:", error);
      res.status(500).json({ message: "Failed to create student" });
    }
  });

  // Behavior log routes
  app.get("/api/organizations/:orgId/students/:studentId/behavior-logs", isAuthenticated, checkOrganizationAccess, async (req: any, res) => {
    try {
      const { orgId, studentId } = req.params;
      const logs = await storage.getBehaviorLogs(studentId, orgId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching behavior logs:", error);
      res.status(500).json({ message: "Failed to fetch behavior logs" });
    }
  });

  app.post("/api/organizations/:orgId/students/:studentId/behavior-logs", isAuthenticated, checkOrganizationAccess, async (req: any, res) => {
    try {
      const { orgId, studentId } = req.params;
      const log = await storage.createBehaviorLog({
        ...req.body,
        organizationId: orgId,
        studentId,
      });
      res.json(log);
    } catch (error) {
      console.error("Error creating behavior log:", error);
      res.status(500).json({ message: "Failed to create behavior log" });
    }
  });

  app.patch("/api/organizations/:orgId/behavior-logs/:id", isAuthenticated, checkOrganizationAccess, async (req: any, res) => {
    try {
      const { orgId, id } = req.params;
      const log = await storage.updateBehaviorLog(id, orgId, req.body);
      res.json(log);
    } catch (error) {
      console.error("Error updating behavior log:", error);
      res.status(500).json({ message: "Failed to update behavior log" });
    }
  });

  app.delete("/api/organizations/:orgId/behavior-logs/:id", isAuthenticated, checkOrganizationAccess, async (req: any, res) => {
    try {
      const { orgId, id } = req.params;
      await storage.deleteBehaviorLog(id, orgId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting behavior log:", error);
      res.status(500).json({ message: "Failed to delete behavior log" });
    }
  });

  // AI Assistant chat endpoint
  app.post("/api/assistant/chat", isAuthenticated, async (req, res) => {
    try {
      const { messages, context } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Invalid messages format" });
      }

      const response = await getChatCompletion(messages, context);

      res.json({ message: response });
    } catch (error) {
      console.error("Error in assistant chat:", error);
      res.status(500).json({ error: "Failed to get AI response" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
