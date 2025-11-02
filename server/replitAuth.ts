import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// Local development detection
const isLocalDevelopment = () => {
  const nodeEnv = process.env.NODE_ENV;
  const hostname = process.env.HOSTNAME;
  // Check if we're running in development mode or on localhost
  return nodeEnv === "development" || 
         hostname === "localhost" || 
         process.env.LOCAL_AUTH === "true";
};

// Local development mock user ID
const LOCAL_USER_ID = "local-dev-user-00000000-0000-0000-0000-000000000000";

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

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
      secure: !isLocalDevelopment(), // Allow HTTP cookies in local development
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

// Setup local development user
async function setupLocalDevUser() {
  try {
    // Check if local dev user exists
    const existingUser = await storage.getUser(LOCAL_USER_ID);
    if (!existingUser) {
      // Create local development user
      await storage.upsertUser({
        id: LOCAL_USER_ID,
        email: "local-dev@example.com",
        firstName: "Local",
        lastName: "Developer",
        profileImageUrl: null,
      });
      console.log("Created local development user");
    }
  } catch (error) {
    console.error("Error setting up local dev user:", error);
  }
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Local development mode - bypass OIDC
  if (isLocalDevelopment()) {
    console.log("Running in local development mode - OIDC authentication bypassed");
    
    // Setup local dev user if it doesn't exist
    await setupLocalDevUser();

    passport.serializeUser((user: Express.User, cb) => cb(null, user));
    passport.deserializeUser((user: Express.User, cb) => cb(null, user));

    // Auto-login endpoint for local development
    app.get("/api/login", async (req, res) => {
      // Create mock user object for local dev
      const mockUser = {
        claims: {
          sub: LOCAL_USER_ID,
          email: "local-dev@example.com",
          first_name: "Local",
          last_name: "Developer",
        },
        expires_at: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days
      };
      
      req.login(mockUser, (err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to login" });
        }
        res.redirect("/");
      });
    });

    app.get("/api/logout", (req, res) => {
      req.logout(() => {
        res.redirect("/");
      });
    });

    // Auto-authenticate on first request in local dev
    app.use(async (req, res, next) => {
      if (!req.isAuthenticated()) {
        const mockUser = {
          claims: {
            sub: LOCAL_USER_ID,
            email: "local-dev@example.com",
            first_name: "Local",
            last_name: "Developer",
          },
          expires_at: Math.floor(Date.now() / 1000) + 86400 * 7,
        };
        req.login(mockUser, () => {
          next();
        });
      } else {
        next();
      }
    });

    return; // Skip OIDC setup
  }

  // Production OIDC setup
  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // Keep track of registered strategies
  const registeredStrategies = new Set<string>();

  // Helper function to ensure strategy exists for a domain
  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // Local development bypass
  if (isLocalDevelopment()) {
    // Ensure user is authenticated in local dev (should be auto-authenticated)
    if (!req.isAuthenticated()) {
      const mockUser = {
        claims: {
          sub: LOCAL_USER_ID,
          email: "local-dev@example.com",
          first_name: "Local",
          last_name: "Developer",
        },
        expires_at: Math.floor(Date.now() / 1000) + 86400 * 7,
      };
      req.login(mockUser, () => {
        return next();
      });
      return;
    }
    return next();
  }

  // Production OIDC authentication
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

export const checkOrganizationAccess: RequestHandler = async (req, res, next) => {
  const user = req.user as any;
  const userId = user?.claims?.sub || (isLocalDevelopment() ? LOCAL_USER_ID : null);
  const orgId = req.params.orgId || req.params.id;

  if (!orgId) {
    return res.status(400).json({ message: "Organization ID required" });
  }

  // In local development, allow access to all organizations for the local dev user
  if (isLocalDevelopment() && userId === LOCAL_USER_ID) {
    return next();
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
