import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getChatCompletion } from "./openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // AI Assistant chat endpoint
  app.post("/api/assistant/chat", async (req, res) => {
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
