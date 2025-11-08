import { createClient } from "@supabase/supabase-js";
import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// Initialize Supabase client with environment-specific configuration
// Development uses DEV_SUPABASE_* variables, production uses PROD_SUPABASE_* variables
const isDevelopment = process.env.NODE_ENV === "development";

const supabaseUrl = isDevelopment 
  ? (process.env.DEV_SUPABASE_URL || process.env.SUPABASE_URL)
  : (process.env.PROD_SUPABASE_URL || process.env.SUPABASE_URL);

const supabaseAnonKey = isDevelopment
  ? (process.env.DEV_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)
  : (process.env.PROD_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY);

if (!supabaseUrl || !supabaseAnonKey) {
  const envPrefix = isDevelopment ? "DEV_" : "PROD_";
  throw new Error(
    `Missing Supabase credentials for ${isDevelopment ? "development" : "production"}. ` +
    `Please set ${envPrefix}SUPABASE_URL and ${envPrefix}SUPABASE_ANON_KEY environment variables.`
  );
}

console.log(`Using Supabase project for ${isDevelopment ? "development" : "production"}: ${supabaseUrl}`);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict", // CSRF protection
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
}

// Middleware to check if user is authenticated
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const session = req.session as any;
  
  if (!session.supabaseUserId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  next();
};

// Middleware to check organization access
export const checkOrganizationAccess: RequestHandler = async (req, res, next) => {
  const session = req.session as any;
  const userId = session.supabaseUserId;
  const orgId = req.params.orgId || req.params.id;

  if (!orgId) {
    return res.status(400).json({ message: "Organization ID required" });
  }

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const userOrgs = await storage.getUserOrganizations(userId);
    const hasAccess = userOrgs.some((org) => org.id === orgId);

    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied to this organization" });
    }

    next();
  } catch (error) {
    console.error("Error checking organization access:", error);
    res.status(500).json({ message: "Failed to verify organization access" });
  }
};
