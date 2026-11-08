import dotenv from "dotenv";

dotenv.config({ quiet: true });

const { pool } = await import("../server/db");

const statements = [
  `ALTER TABLE membership_loyalty_rewards ADD COLUMN IF NOT EXISTS cycle_number integer NOT NULL DEFAULT 1`,
  `ALTER TABLE membership_loyalty_rewards ADD COLUMN IF NOT EXISTS threshold_months integer NOT NULL DEFAULT 1`,
  `ALTER TABLE membership_loyalty_rewards ADD COLUMN IF NOT EXISTS earned_at timestamp NOT NULL DEFAULT now()`,
  `ALTER TABLE membership_loyalty_rewards ADD COLUMN IF NOT EXISTS redemption_deadline timestamp`,
  `ALTER TABLE membership_loyalty_rewards ADD COLUMN IF NOT EXISTS source_payment_association_id integer`,
  `ALTER TABLE beat_purchases ADD COLUMN IF NOT EXISTS user_id integer`,
  `ALTER TABLE beat_purchases ADD COLUMN IF NOT EXISTS license_product text NOT NULL DEFAULT 'paid_nonexclusive'`,
  `ALTER TABLE beat_purchases ADD COLUMN IF NOT EXISTS license_version integer NOT NULL DEFAULT 1`,
  `ALTER TABLE beat_purchases ADD COLUMN IF NOT EXISTS nonexclusive boolean NOT NULL DEFAULT true`,
  `ALTER TABLE beat_purchases ADD COLUMN IF NOT EXISTS license_start_date timestamp`,
  `ALTER TABLE beat_purchases ADD COLUMN IF NOT EXISTS rights_snapshot json`,
  `ALTER TABLE beat_purchases ADD COLUMN IF NOT EXISTS content_id_acknowledged boolean NOT NULL DEFAULT false`,
  `ALTER TABLE beat_purchases ADD COLUMN IF NOT EXISTS reward_source_type text`,
  `ALTER TABLE beat_purchases ADD COLUMN IF NOT EXISTS reward_source_id integer`,
  `ALTER TABLE beat_purchases ADD COLUMN IF NOT EXISTS license_status text NOT NULL DEFAULT 'pending'`,
  `ALTER TABLE beat_purchases ADD COLUMN IF NOT EXISTS signed_snapshot_hash text`,
];

const client = await pool.connect();
try {
  await client.query("BEGIN");
  for (const statement of statements) await client.query(statement);
  await client.query("COMMIT");
  console.log(`Added or verified ${statements.length} checkout schema columns without deleting data.`);
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
