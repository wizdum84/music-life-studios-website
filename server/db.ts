import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL is not set. The server will use in-memory development storage.");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://localhost:5432/soundcraftstudio_dev",
});
export const db = drizzle(pool, { schema });
