import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL is not set. The server will use in-memory development storage.");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://localhost:5432/soundcraftstudio_dev",
});
export const db = drizzle(pool, { schema });

// Keep advisory-lock connections separate so waiting locks cannot starve queries.
export const bookingLockPool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://localhost:5432/soundcraftstudio_dev",
  max: 3,
  connectionTimeoutMillis: 30000,
});
