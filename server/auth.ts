import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request } from "express";
import session from "express-session";
import { createCipheriv, createDecipheriv, createHash, createHmac, scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { insertUserSchema, User as UserType } from "@shared/schema";
import QRCode from "qrcode";
import { sendEmailVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from "./services/email";

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
  try {
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) return false;
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return hashedBuf.length === suppliedBuf.length && timingSafeEqual(hashedBuf, suppliedBuf);
  } catch {
    return false;
  }
}

type SecurityPurpose = "verify-email" | "reset-password" | "mfa-login" | "mfa-setup";
function securitySecret() { return process.env.SESSION_SECRET!; }
function issueSecurityToken(payload: Record<string, unknown> & { purpose: SecurityPurpose }, seconds: number) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + seconds * 1000 })).toString("base64url");
  const signature = createHmac("sha256", securitySecret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}
function readSecurityToken(token: string, purpose: SecurityPurpose) {
  try {
    const [body, supplied] = token.split(".");
    if (!body || !supplied) return null;
    const expected = createHmac("sha256", securitySecret()).update(body).digest();
    const actual = Buffer.from(supplied, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    return payload.purpose === purpose && Number(payload.exp) > Date.now() ? payload : null;
  } catch { return null; }
}
function credentialVersion(passwordHash: string) { return createHash("sha256").update(passwordHash).digest("hex").slice(0, 20); }
function publicUser(user: UserType | Express.User) { const { password: _password, mfaSecret: _mfaSecret, ...safe } = user as UserType; return safe; }
function appOrigin(req: Request) { return (process.env.APP_ORIGIN || `${req.protocol}://${req.get("host")}`).replace(/\/$/, ""); }

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function createTotpSecret() {
  const bytes = randomBytes(20);
  let bits = "";
  for (let index = 0; index < bytes.length; index += 1) bits += bytes[index].toString(2).padStart(8, "0");
  let output = "";
  for (let index = 0; index < bits.length; index += 5) output += BASE32[parseInt(bits.slice(index, index + 5).padEnd(5, "0"), 2)];
  return output;
}
function decodeBase32(value: string) {
  let bits = "";
  for (const char of value.replace(/=+$/g, "").toUpperCase()) { const index = BASE32.indexOf(char); if (index < 0) throw new Error("Invalid MFA secret"); bits += index.toString(2).padStart(5, "0"); }
  const bytes: number[] = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) bytes.push(parseInt(bits.slice(index, index + 8), 2));
  return Buffer.from(bytes);
}
function totpCode(secret: string, time = Date.now()) {
  const counter = Math.floor(time / 30000);
  const data = Buffer.alloc(8); data.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", decodeBase32(secret)).update(data).digest();
  const offset = digest[digest.length - 1] & 15;
  return String((digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}
function verifyTotp(secret: string, code: string) {
  if (!/^\d{6}$/.test(code)) return false;
  return [-1, 0, 1].some((step) => { const expected = Buffer.from(totpCode(secret, Date.now() + step * 30000)); const actual = Buffer.from(code); return actual.length === expected.length && timingSafeEqual(actual, expected); });
}
function encryptMfaSecret(secret: string) {
  const key = createHash("sha256").update(securitySecret()).digest(); const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv); const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("base64url")).join(".");
}
function decryptMfaSecret(value: string) {
  const [iv, tag, encrypted] = value.split(".").map((part) => Buffer.from(part, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", createHash("sha256").update(securitySecret()).digest(), iv); decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export const accountSecurityInternals = {
  issueSecurityToken,
  readSecurityToken,
  createTotpSecret,
  totpCode,
  verifyTotp,
  encryptMfaSecret,
  decryptMfaSecret,
};

export function setupAuth(app: Express) {
  // Configure session
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET must be set to a random value of at least 32 characters in production.");
    }
    process.env.SESSION_SECRET = randomBytes(32).toString("hex");
    console.warn("No strong SESSION_SECRET set. Generated a temporary development secret.");
  }

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    }
  };

  app.set("trust proxy", process.env.NODE_ENV === "production" ? 1 : false);
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
      const parsed = insertUserSchema.safeParse({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        firstName: req.body.firstName || undefined,
        lastName: req.body.lastName || undefined,
        phone: req.body.phone || undefined,
        role: "customer",
      });
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0]?.message || "Enter valid registration details." });
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(parsed.data.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Check if email is provided and already exists
      if (parsed.data.email) {
        const existingEmail = await storage.getUserByEmail(parsed.data.email);
        if (existingEmail) {
          return res.status(400).json({ error: "Email already in use" });
        }
      }

      // Hash password
      const hashedPassword = await hashPassword(parsed.data.password);

      // Create user with loyalty program fields initialized
      const user = await storage.createUser({
        ...parsed.data,
        password: hashedPassword,
        role: "customer",
        loyaltyPoints: 0,
        sessionCount: 0,
        lastLogin: new Date(),
      } as any);

      // Email failures must not undo a successfully created account.
      void sendWelcomeEmail(user).then((sent) => {
        if (!sent) console.warn(`Welcome email unavailable for user ${user.id}`);
      }).catch(() => console.error(`Welcome email failed for user ${user.id}`));
      const verificationToken = issueSecurityToken({ purpose: "verify-email", uid: user.id, version: credentialVersion(user.password) }, 24 * 60 * 60);
      void sendEmailVerificationEmail(user, `${appOrigin(req)}/verify-email?token=${encodeURIComponent(verificationToken)}`)
        .catch(() => console.error(`Verification email failed for user ${user.id}`));

      // Log in the user
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ error: "Login failed after registration" });
        }
        return res.status(201).json({ user: publicUser(user) });
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
        return res.status(201).json({ user: publicUser(user) });
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
      if (user.role === "admin" && user.mfaEnabled && user.mfaSecret) {
        return res.status(202).json({
          mfaRequired: true,
          mfaToken: issueSecurityToken({ purpose: "mfa-login", uid: user.id, version: credentialVersion(user.password) }, 5 * 60),
        });
      }
      req.login(user, (loginErr) => {
        if (loginErr) {
          return next(loginErr);
        }
        return res.json({ user: publicUser(user) });
      });
    })(req, res, next);
  });

  app.post("/api/user/password", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });

    try {
      const currentPassword = typeof req.body.currentPassword === "string" ? req.body.currentPassword : "";
      const newPasswordResult = insertUserSchema.pick({ password: true }).safeParse({ password: req.body.newPassword });
      if (!currentPassword || !newPasswordResult.success) {
        return res.status(400).json({ error: newPasswordResult.success ? "Current password is required" : newPasswordResult.error.issues[0]?.message || "Enter a valid new password" });
      }

      const user = await storage.getUser(req.user!.id);
      if (!user || !(await comparePasswords(currentPassword, user.password))) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      const updatedUser = await storage.updateUser(user.id, { password: await hashPassword(newPasswordResult.data.password) });
      if (!updatedUser) return res.status(404).json({ error: "Account not found" });

      // Rotate the session after a credential change to invalidate the old session ID.
      req.session.regenerate((regenerateError) => {
        if (regenerateError) return res.status(500).json({ error: "Password changed, but session renewal failed" });
        req.login(updatedUser, (loginError) => {
          if (loginError) return res.status(500).json({ error: "Password changed, but login renewal failed" });
          return res.json({ user: publicUser(updatedUser) });
        });
      });
    } catch (error) {
      console.error("Password change error:", error);
      res.status(500).json({ error: "Password change failed" });
    }
  });

  app.post("/api/login/mfa", async (req, res, next) => {
    try {
      const claims = readSecurityToken(String(req.body.mfaToken || ""), "mfa-login");
      const user = claims ? await storage.getUser(Number(claims.uid)) : undefined;
      if (!user || user.role !== "admin" || !user.mfaEnabled || !user.mfaSecret || claims.version !== credentialVersion(user.password) || !verifyTotp(decryptMfaSecret(user.mfaSecret), String(req.body.code || ""))) {
        return res.status(401).json({ error: "Invalid or expired verification code" });
      }
      await storage.updateUserLoginTime(user.id);
      req.login(user, (error) => error ? next(error) : res.json({ user: publicUser(user) }));
    } catch { res.status(401).json({ error: "Invalid or expired verification code" }); }
  });

  app.post("/api/password/forgot", async (req, res) => {
    const response = { message: "If that email belongs to an account, a reset link has been sent." };
    try {
      const email = String(req.body.email || "").trim().toLowerCase();
      const user = email ? await storage.getUserByEmail(email) : undefined;
      if (user) {
        const token = issueSecurityToken({ purpose: "reset-password", uid: user.id, version: credentialVersion(user.password) }, 30 * 60);
        await sendPasswordResetEmail(user, `${appOrigin(req)}/reset-password?token=${encodeURIComponent(token)}`);
      }
    } catch { /* Keep the response identical to prevent account discovery. */ }
    res.json(response);
  });

  app.post("/api/password/reset", async (req, res) => {
    const parsed = insertUserSchema.pick({ password: true }).safeParse({ password: req.body.password });
    const claims = readSecurityToken(String(req.body.token || ""), "reset-password");
    const user = claims ? await storage.getUser(Number(claims.uid)) : undefined;
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || "Enter a valid password" });
    if (!user || claims.version !== credentialVersion(user.password)) return res.status(400).json({ error: "This reset link is invalid or expired" });
    await storage.updateUser(user.id, { password: await hashPassword(parsed.data.password) });
    res.json({ message: "Password reset successfully. You can now sign in." });
  });

  app.post("/api/email/verify", async (req, res) => {
    const claims = readSecurityToken(String(req.body.token || ""), "verify-email");
    const user = claims ? await storage.getUser(Number(claims.uid)) : undefined;
    if (!user || claims.version !== credentialVersion(user.password)) return res.status(400).json({ error: "This verification link is invalid or expired" });
    if (!user.emailVerifiedAt) await storage.updateUser(user.id, { emailVerifiedAt: new Date() });
    res.json({ message: "Email verified successfully." });
  });

  app.post("/api/email/resend", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    const user = await storage.getUser(req.user!.id);
    if (!user) return res.status(404).json({ error: "Account not found" });
    if (user.emailVerifiedAt) return res.json({ message: "Email is already verified." });
    const token = issueSecurityToken({ purpose: "verify-email", uid: user.id, version: credentialVersion(user.password) }, 24 * 60 * 60);
    await sendEmailVerificationEmail(user, `${appOrigin(req)}/verify-email?token=${encodeURIComponent(token)}`);
    res.json({ message: "Verification email sent." });
  });

  app.post("/api/admin/mfa/setup", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") return res.status(403).json({ error: "Access denied" });
    const secret = createTotpSecret();
    const issuer = "Music Life Studios";
    const uri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(req.user!.email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&digits=6&period=30`;
    const setupToken = issueSecurityToken({ purpose: "mfa-setup", uid: req.user!.id, secret }, 10 * 60);
    res.json({ qrCode: await QRCode.toDataURL(uri), manualKey: secret, setupToken });
  });

  app.post("/api/admin/mfa/enable", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") return res.status(403).json({ error: "Access denied" });
    const claims = readSecurityToken(String(req.body.setupToken || ""), "mfa-setup");
    if (!claims || Number(claims.uid) !== req.user!.id || !verifyTotp(String(claims.secret || ""), String(req.body.code || ""))) return res.status(400).json({ error: "Invalid or expired verification code" });
    const updated = await storage.updateUser(req.user!.id, { mfaEnabled: true, mfaSecret: encryptMfaSecret(String(claims.secret)) });
    res.json({ user: updated ? publicUser(updated) : null });
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
      const user = publicUser(req.user!);
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
