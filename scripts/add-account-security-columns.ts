import "dotenv/config";
import { pool } from "../server/db";

async function main() {
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at timestamp;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_enabled boolean NOT NULL DEFAULT false;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_secret text;
  `);
  console.log("Account security columns are ready.");
  await pool.end();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Account security migration failed");
  process.exit(1);
});
