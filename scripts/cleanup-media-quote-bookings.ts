import dotenv from "dotenv";

dotenv.config({ quiet: true });

const { pool } = await import("../server/db");

const client = await pool.connect();
try {
  const result = await client.query<{ id: number }>(
    `DELETE FROM bookings
     WHERE amount = 0
       AND status = 'pending'
       AND payment_status = 'unpaid'
       AND details ILIKE $1
     RETURNING id`,
    ["%Service path: media-quote%"],
  );
  console.log(`Removed ${result.rowCount ?? 0} legacy media quote booking record(s).`);
} finally {
  client.release();
  await pool.end();
}
