import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, checkOrganizationAccess } from "./replitAuth";
import { getChatCompletion, transcribeAudio } from "./openai";
import { insertFollowUpSchema } from "@shared/schema";

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

  app.get("/api/organizations/:id/stats", isAuthenticated, checkOrganizationAccess, async (req: any, res) => {
    try {
      const { id } = req.params;
      const stats = await storage.getDashboardStats(id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
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

  app.get("/api/organizations/:orgId/students/:id", isAuthenticated, checkOrganizationAccess, async (req: any, res) => {
    try {
      const { orgId, id } = req.params;
      const student = await storage.getStudent(id, orgId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      console.error("Error fetching student:", error);
      res.status(500).json({ message: "Failed to fetch student" });
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
    } catch (error: any) {
      console.error("Error creating student:", error);
      
      if (error.message && error.message.includes("already exists")) {
        return res.status(400).json({ message: error.message });
      }
      
      if (error.code === "23505" || (error.constraint && error.constraint === "unique_email_per_org")) {
        const email = req.body.email;
        return res.status(400).json({ 
          message: `A student with email ${email} already exists in this organization` 
        });
      }
      
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
        organizationId: orgId,
        studentId,
        category: req.body.category,
        notes: req.body.notes,
        incidentDate: req.body.incidentDate ? new Date(req.body.incidentDate) : new Date(),
        loggedBy: req.body.loggedBy || "Unknown",
        strategies: req.body.strategies || null,
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

  // Meeting notes routes
  app.get("/api/organizations/:orgId/students/:studentId/meeting-notes", isAuthenticated, checkOrganizationAccess, async (req: any, res) => {
    try {
      const { orgId, studentId } = req.params;
      const notes = await storage.getMeetingNotes(studentId, orgId);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching meeting notes:", error);
      res.status(500).json({ message: "Failed to fetch meeting notes" });
    }
  });

  app.post("/api/organizations/:orgId/students/:studentId/meeting-notes", isAuthenticated, checkOrganizationAccess, async (req: any, res) => {
    try {
      const { orgId, studentId } = req.params;
      const { title, date, participants, notes, transcript } = req.body;
      
      // Combine notes and transcript into summary and fullNotes
      const summary = title || "Meeting notes";
      const fullNotes = transcript ? `${notes || ""}\n\n--- Transcript ---\n${transcript}` : notes || "";
      
      const meetingNote = await storage.createMeetingNote({
        organizationId: orgId,
        studentId,
        date: date ? new Date(date) : new Date(),
        participants: participants || [],
        summary,
        fullNotes,
      });
      
      res.json(meetingNote);
    } catch (error: any) {
      console.error("Error creating meeting note:", error);
      res.status(500).json({ message: "Failed to create meeting note", error: error.message });
    }
  });

  // Follow-ups routes
  app.get("/api/organizations/:orgId/students/:studentId/follow-ups", isAuthenticated, checkOrganizationAccess, async (req: any, res) => {
    try {
      const { orgId, studentId } = req.params;
      const followUps = await storage.getFollowUps(studentId, orgId);
      res.json(followUps);
    } catch (error) {
      console.error("Error fetching follow-ups:", error);
      res.status(500).json({ message: "Failed to fetch follow-ups" });
    }
  });

  app.post("/api/organizations/:orgId/students/:studentId/follow-ups", isAuthenticated, checkOrganizationAccess, async (req: any, res) => {
    try {
      const { orgId, studentId } = req.params;
      
      // Prepare follow-up data with proper date formatting
      const followUpData: any = {
        title: req.body.title,
        description: req.body.description || null,
        status: req.body.status || "To-Do",
        assignee: req.body.assignee || null,
        organizationId: orgId,
        studentId,
      };
      
      // Convert dueDate string to Date object if provided
      if (req.body.dueDate) {
        followUpData.dueDate = new Date(req.body.dueDate);
      } else {
        followUpData.dueDate = null;
      }
      
      // Validate with schema
      const validatedData = insertFollowUpSchema.parse(followUpData);
      const newFollowUp = await storage.createFollowUp(validatedData);
      res.json(newFollowUp);
    } catch (error: any) {
      console.error("Error creating follow-up:", error);
      
      // Provide more detailed error messages
      if (error.code === "23503") {
        res.status(400).json({ message: "Invalid organization or student ID" });
      } else if (error.name === "ZodError") {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create follow-up", error: error.message });
      }
    }
  });

  app.patch("/api/organizations/:orgId/follow-ups/:id", isAuthenticated, checkOrganizationAccess, async (req: any, res) => {
    try {
      const { orgId, id } = req.params;
      
      // Prepare update data with proper date formatting
      const updateData: any = { ...req.body };
      
      // Convert dueDate string to Date object if provided
      if (updateData.dueDate) {
        updateData.dueDate = new Date(updateData.dueDate);
      }
      
      const updatedFollowUp = await storage.updateFollowUp(id, orgId, updateData);
      res.json(updatedFollowUp);
    } catch (error) {
      console.error("Error updating follow-up:", error);
      res.status(500).json({ message: "Failed to update follow-up" });
    }
  });

  app.delete("/api/organizations/:orgId/follow-ups/:id", isAuthenticated, checkOrganizationAccess, async (req: any, res) => {
    try {
      const { orgId, id } = req.params;
      await storage.deleteFollowUp(id, orgId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting follow-up:", error);
      res.status(500).json({ message: "Failed to delete follow-up" });
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

  // Whisper transcription endpoint
  app.post("/api/transcribe", isAuthenticated, async (req, res) => {
    try {
      if (!req.body.audio) {
        return res.status(400).json({ error: "Audio data is required" });
      }

      // Convert base64 audio to Buffer
      const audioBuffer = Buffer.from(req.body.audio, 'base64');
      
      if (audioBuffer.length === 0) {
        return res.status(400).json({ error: "Invalid audio data" });
      }

      const transcription = await transcribeAudio(
        audioBuffer,
        req.body.filename || "audio.webm"
      );

      res.json({
        text: transcription.text,
        language: transcription.language,
        segments: transcription.segments,
      });
    } catch (error: any) {
      console.error("Error in transcription:", error);
      res.status(500).json({ error: "Failed to transcribe audio", message: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
