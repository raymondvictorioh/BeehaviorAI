import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, checkOrganizationAccess } from "./replitAuth";
import { getChatCompletion, transcribeAudio, generateMeetingSummary } from "./openai";
import { insertFollowUpSchema } from "@shared/schema";

const isLocalDevelopment = () => {
  return process.env.LOCAL_AUTH === "true";
};

const LOCAL_USER_ID = "local-dev-user-00000000-0000-0000-0000-000000000000";

// Helper function to get userId from request, handling both local dev and production
function getUserId(req: any): string {
  if (isLocalDevelopment()) {
    return req.user?.claims?.sub || req.user?.sub || LOCAL_USER_ID;
  }
  return req.user.claims.sub;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
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
      const userId = getUserId(req);
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

  app.patch("/api/organizations/:id", isAuthenticated, checkOrganizationAccess, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { name, code, email, phone, address } = req.body;

      console.log(`[DEBUG] Updating organization ${id} with data:`, { name, code, email, phone, address });

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (code !== undefined) updateData.code = code || null;
      if (email !== undefined) updateData.email = email || null;
      if (phone !== undefined) updateData.phone = phone || null;
      if (address !== undefined) updateData.address = address || null;

      const updatedOrganization = await storage.updateOrganization(id, updateData);
      console.log(`[DEBUG] Organization updated successfully:`, updatedOrganization);

      res.json(updatedOrganization);
    } catch (error: any) {
      console.error("Error updating organization:", error);
      res.status(500).json({ message: error.message || "Failed to update organization" });
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

  app.patch("/api/organizations/:orgId/students/:id", isAuthenticated, checkOrganizationAccess, async (req: any, res) => {
    try {
      const { orgId, id } = req.params;
      const updateData: any = {};
      
      if (req.body.name !== undefined) updateData.name = req.body.name;
      if (req.body.email !== undefined) updateData.email = req.body.email || null;
      if (req.body.classId !== undefined) updateData.classId = req.body.classId || null;
      if (req.body.gender !== undefined) updateData.gender = req.body.gender || null;
      
      // Remove undefined fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });
      
      const updatedStudent = await storage.updateStudent(id, orgId, updateData);
      res.json(updatedStudent);
    } catch (error: any) {
      console.error("Error updating student:", error);
      
      if (error.message && error.message.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      
      if (error.message && error.message.includes("already exists")) {
        return res.status(400).json({ message: error.message });
      }
      
      if (error.code === "23505" || (error.constraint && error.constraint === "unique_email_per_org")) {
        const email = req.body.email;
        return res.status(400).json({ 
          message: `A student with email ${email} already exists in this organization` 
        });
      }
      
      res.status(500).json({ message: "Failed to update student", error: error.message });
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
        categoryId: req.body.categoryId,
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

  // Behavior Log Category routes
  app.get("/api/organizations/:orgId/categories", isAuthenticated, checkOrganizationAccess, async (req: any, res) => {
    try {
      const { orgId } = req.params;
      const categories = await storage.getBehaviorLogCategories(orgId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/organizations/:orgId/categories", isAuthenticated, checkOrganizationAccess, async (req: any, res) => {
    try {
      const { orgId } = req.params;
      const category = await storage.createBehaviorLogCategory({
        organizationId: orgId,
        name: req.body.name,
        description: req.body.description || null,
        color: req.body.color || null,
        displayOrder: req.body.displayOrder ?? 999,
      });
      res.json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.patch("/api/organizations/:orgId/categories/:id", isAuthenticated, checkOrganizationAccess, async (req: any, res) => {
    try {
      const { orgId, id } = req.params;
      const category = await storage.updateBehaviorLogCategory(id, orgId, req.body);
      res.json(category);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/organizations/:orgId/categories/:id", isAuthenticated, checkOrganizationAccess, async (req: any, res) => {
    try {
      const { orgId, id } = req.params;
      await storage.deleteBehaviorLogCategory(id, orgId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
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

      console.log(`[DEBUG] PATCH follow-up request:`, {
        orgId,
        followUpId: id,
        body: req.body,
        bodyKeys: Object.keys(req.body),
      });

      // Prepare update data - only include fields that are actually provided
      // This allows partial updates (e.g., only updating status)
      const updateData: any = {};

      // Only include fields that are present in the request body
      // IMPORTANT: For required fields like 'title', we should not allow setting them to null/empty
      if (req.body.title !== undefined) {
        // Don't allow empty title since it's required in DB
        if (req.body.title === null || req.body.title === "") {
          return res.status(400).json({ message: "Title cannot be empty" });
        }
        updateData.title = req.body.title;
      }

      if (req.body.description !== undefined) {
        updateData.description = req.body.description || null;
      }

      if (req.body.status !== undefined) {
        updateData.status = req.body.status;
      }

      if (req.body.assignee !== undefined) {
        updateData.assignee = req.body.assignee || null;
      }

      // Convert dueDate string to Date object if provided
      if (req.body.dueDate !== undefined) {
        if (req.body.dueDate) {
          updateData.dueDate = new Date(req.body.dueDate);
        } else {
          updateData.dueDate = null;
        }
      }

      // Remove fields that shouldn't be updated
      delete updateData.organizationId;
      delete updateData.studentId;
      delete updateData.id;

      // Ensure at least one field is being updated
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "No fields provided to update" });
      }

      console.log(`[DEBUG] Update data prepared:`, updateData);

      const updatedFollowUp = await storage.updateFollowUp(id, orgId, updateData);
      console.log(`[DEBUG] Follow-up updated successfully`);

      res.json(updatedFollowUp);
    } catch (error: any) {
      console.error("Error updating follow-up:", error);

      // Provide more detailed error messages
      if (error.code === "23503") {
        res.status(400).json({ message: "Invalid organization or follow-up ID" });
      } else if (error.name === "ZodError") {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else if (error.code === "23502") {
        // NOT NULL constraint violation
        res.status(400).json({ message: "Failed to update follow-up", error: error.message });
      } else {
        res.status(500).json({ message: "Failed to update follow-up", error: error.message });
      }
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

  // Behavior Log Categories routes
  app.get("/api/organizations/:orgId/behavior-log-categories", isAuthenticated, checkOrganizationAccess, async (req: any, res) => {
    try {
      const { orgId } = req.params;
      console.log(`[DEBUG] Fetching categories for orgId: ${orgId}`);
      
      if (!orgId) {
        return res.status(400).json({ message: "Organization ID is required" });
      }
      
      const categories = await storage.getBehaviorLogCategories(orgId);
      console.log(`[DEBUG] Found ${categories.length} categories`);
      
      return res.json(categories);
    } catch (error: any) {
      console.error("Error fetching behavior log categories:", error);
      console.error("Error stack:", error?.stack);
      return res.status(500).json({ 
        message: "Failed to fetch behavior log categories",
        error: error?.message || String(error)
      });
    }
  });

  app.post("/api/organizations/:orgId/behavior-log-categories", isAuthenticated, checkOrganizationAccess, async (req: any, res) => {
    try {
      const { orgId } = req.params;
      const categoryData = {
        organizationId: orgId,
        name: req.body.name,
        description: req.body.description || null,
        color: req.body.color || null,
        displayOrder: req.body.displayOrder ?? 0,
      };
      const newCategory = await storage.createBehaviorLogCategory(categoryData);
      res.json(newCategory);
    } catch (error: any) {
      console.error("Error creating behavior log category:", error);
      res.status(500).json({ message: "Failed to create behavior log category", error: error.message });
    }
  });

  app.patch("/api/organizations/:orgId/behavior-log-categories/:id", isAuthenticated, checkOrganizationAccess, async (req: any, res) => {
    try {
      const { orgId, id } = req.params;
      const updateData: any = {
        name: req.body.name,
        description: req.body.description || null,
        color: req.body.color || null,
        displayOrder: req.body.displayOrder,
      };
      
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const updatedCategory = await storage.updateBehaviorLogCategory(id, orgId, updateData);
      res.json(updatedCategory);
    } catch (error: any) {
      console.error("Error updating behavior log category:", error);
      if (error.message?.includes("not found")) {
        res.status(404).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to update behavior log category", error: error.message });
      }
    }
  });

  app.delete("/api/organizations/:orgId/behavior-log-categories/:id", isAuthenticated, checkOrganizationAccess, async (req: any, res) => {
    try {
      const { orgId, id } = req.params;
      await storage.deleteBehaviorLogCategory(id, orgId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting behavior log category:", error);
      res.status(500).json({ message: "Failed to delete behavior log category", error: error.message });
    }
  });

  // Class routes
  app.get("/api/organizations/:orgId/classes", isAuthenticated, checkOrganizationAccess, async (req: any, res) => {
    try {
      const { orgId } = req.params;
      const includeArchived = req.query.includeArchived === "true";
      const allClasses = await storage.getClasses(orgId);
      const classes = includeArchived ? allClasses : allClasses.filter(c => !c.isArchived);
      res.json(classes);
    } catch (error: any) {
      console.error("Error fetching classes:", error);
      res.status(500).json({ message: "Failed to fetch classes", error: error.message });
    }
  });

  app.get("/api/organizations/:orgId/classes/:id", isAuthenticated, checkOrganizationAccess, async (req: any, res) => {
    try {
      const { orgId, id } = req.params;
      const classData = await storage.getClass(id, orgId);
      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }
      res.json(classData);
    } catch (error: any) {
      console.error("Error fetching class:", error);
      res.status(500).json({ message: "Failed to fetch class", error: error.message });
    }
  });

  app.post("/api/organizations/:orgId/classes", isAuthenticated, checkOrganizationAccess, async (req: any, res) => {
    try {
      const { orgId } = req.params;
      const classData = {
        organizationId: orgId,
        name: req.body.name,
        description: req.body.description || null,
        isArchived: req.body.isArchived ?? false,
      };
      const newClass = await storage.createClass(classData);
      res.json(newClass);
    } catch (error: any) {
      console.error("Error creating class:", error);
      res.status(500).json({ message: "Failed to create class", error: error.message });
    }
  });

  app.patch("/api/organizations/:orgId/classes/:id", isAuthenticated, checkOrganizationAccess, async (req: any, res) => {
    try {
      const { orgId, id } = req.params;
      const updateData: any = {};
      
      if (req.body.name !== undefined) updateData.name = req.body.name;
      if (req.body.description !== undefined) updateData.description = req.body.description || null;
      if (req.body.isArchived !== undefined) updateData.isArchived = req.body.isArchived;
      
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const updatedClass = await storage.updateClass(id, orgId, updateData);
      res.json(updatedClass);
    } catch (error: any) {
      console.error("Error updating class:", error);
      if (error.message?.includes("not found")) {
        res.status(404).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to update class", error: error.message });
      }
    }
  });

  app.delete("/api/organizations/:orgId/classes/:id", isAuthenticated, checkOrganizationAccess, async (req: any, res) => {
    try {
      const { orgId, id } = req.params;
      await storage.deleteClass(id, orgId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting class:", error);
      if (error.message?.includes("assigned students")) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to delete class", error: error.message });
      }
    }
  });

  // Whisper transcription endpoint
  app.post("/api/transcribe", isAuthenticated, async (req, res) => {
    try {
      if (!req.body.audio) {
        console.error("Transcription request missing audio data");
        return res.status(400).json({ error: "Audio data is required" });
      }

      // Convert base64 audio to Buffer
      const audioBuffer = Buffer.from(req.body.audio, 'base64');
      
      if (audioBuffer.length === 0) {
        console.error("Transcription request with empty audio buffer");
        return res.status(400).json({ error: "Invalid audio data" });
      }

      // Check file size limit (Whisper API limit is 25MB)
      const maxSize = 25 * 1024 * 1024; // 25MB
      if (audioBuffer.length > maxSize) {
        console.error(`Audio file too large: ${audioBuffer.length} bytes (max: ${maxSize})`);
        return res.status(400).json({ error: "Audio file too large. Maximum size is 25MB." });
      }

      console.log(`Transcribing audio: ${audioBuffer.length} bytes, filename: ${req.body.filename || "audio.webm"}`);

      const transcription = await transcribeAudio(
        audioBuffer,
        req.body.filename || "audio.webm"
      );

      console.log(`Transcription successful: ${transcription.text?.length || 0} characters`);

      res.json({
        text: transcription.text,
        language: transcription.language,
        segments: transcription.segments,
      });
    } catch (error: any) {
      console.error("Error in transcription:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      
      // Provide more specific error messages
      let errorMessage = "Failed to transcribe audio";
      if (error.message?.includes("API key")) {
        errorMessage = "OpenAI API key is missing or invalid. Please check your OPENAI_API_KEY environment variable.";
      } else if (error.message?.includes("timeout")) {
        errorMessage = "Transcription request timed out. Please try again.";
      } else if (error.message?.includes("rate limit")) {
        errorMessage = "OpenAI API rate limit exceeded. Please wait a moment and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      res.status(500).json({ 
        error: errorMessage,
        message: error.message,
      });
    }
  });

  // Meeting summary generation endpoint
  app.post("/api/generate-meeting-summary", isAuthenticated, async (req, res) => {
    try {
      const { notes, transcript } = req.body;

      if (!notes && !transcript) {
        return res.status(400).json({ 
          error: "At least notes or transcript is required to generate a summary" 
        });
      }

      console.log("Generating meeting summary...");
      const summary = await generateMeetingSummary(notes || "", transcript || "");
      
      console.log("Meeting summary generated successfully");
      res.json({ summary });
    } catch (error: any) {
      console.error("Error generating meeting summary:", error);
      
      let errorMessage = "Failed to generate meeting summary";
      if (error.message?.includes("API key")) {
        errorMessage = "OpenAI API key is missing or invalid.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      res.status(500).json({ 
        error: errorMessage,
        message: error.message,
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
