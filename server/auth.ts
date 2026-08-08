import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { insertUserSchema, User as UserType } from "@shared/schema";

declare global {
  namespace Express {
    // Define the User interface for Express
    interface User extends UserType {
      role?: string;
    }
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Configure session
  if (!process.env.SESSION_SECRET) {
    // Use a default secret for development
    process.env.SESSION_SECRET = "dev_secret_change_this_in_production";
    console.warn("No SESSION_SECRET env variable set. Using default secret.");
  }

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Try to find user by username first
        let user = await storage.getUserByUsername(username);
        
        // If not found, try by email (username field might contain an email)
        if (!user && username.includes('@')) {
          user = await storage.getUserByEmail(username);
        }
        
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          // Update login time and return the user
          await storage.updateUserLoginTime(user.id);
          return done(null, user);
        }
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err: any) {
      done(err);
    }
  });

  // Auth routes
  app.post("/api/register", async (req, res) => {
    try {
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Check if email is provided and already exists
      if (req.body.email) {
        const existingEmail = await storage.getUserByEmail(req.body.email);
        if (existingEmail) {
          return res.status(400).json({ error: "Email already in use" });
        }
      }

      // Hash password
      const hashedPassword = await hashPassword(req.body.password);

      // Create user with loyalty program fields initialized
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
        loyaltyPoints: 0,
        sessionCount: 0,
        lastLogin: new Date(),
      });

      // Log in the user
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ error: "Login failed after registration" });
        }
        return res.status(201).json({ user: { ...user, password: undefined } });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // A fresh local install has no administrator yet. Allow one first-admin setup
  // in development, then close the endpoint once an admin exists.
  app.post("/api/admin/setup", async (req, res) => {
    try {
      if (process.env.NODE_ENV === "production") {
        return res.status(403).json({ error: "First-admin setup is disabled in production." });
      }

      const existingAdmin = await storage.getAdminUser();
      if (existingAdmin) {
        return res.status(409).json({ error: "An administrator already exists. Use the admin login." });
      }

      const parsed = insertUserSchema.safeParse({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        role: "admin",
        firstName: req.body.firstName || undefined,
        lastName: req.body.lastName || undefined,
        phone: req.body.phone || undefined,
      });
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0]?.message || "Enter valid administrator details." });
      }

      if (await storage.getUserByUsername(parsed.data.username)) {
        return res.status(400).json({ error: "Username already exists" });
      }
      if (await storage.getUserByEmail(parsed.data.email)) {
        return res.status(400).json({ error: "Email already in use" });
      }

      const user = await storage.createUser({
        ...parsed.data,
        password: await hashPassword(parsed.data.password),
      });

      req.login(user, (err) => {
        if (err) return res.status(500).json({ error: "Administrator created, but login failed." });
        return res.status(201).json({ user: { ...user, password: undefined } });
      });
    } catch (error) {
      console.error("Admin setup error:", error);
      res.status(500).json({ error: "Administrator setup failed" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User | false, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      req.login(user, (loginErr) => {
        if (loginErr) {
          return next(loginErr);
        }
        return res.json({ user: { ...user, password: undefined } });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      // Don't send password to client
      const user = { ...req.user, password: undefined };
      return res.json(user);
    }
    return res.status(401).json({ error: "Not authenticated" });
  });

  // Middleware for protecting routes
  app.use("/api/admin/*", (req, res, next) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  });
}
