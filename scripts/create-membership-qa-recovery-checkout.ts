import { pool } from "../server/db";
import { storage } from "../server/storage";
import { createMembershipQaRecoveryCheckout } from "../server/services/membership-qa-recovery";

async function main() {
  console.log(JSON.stringify(await createMembershipQaRecoveryCheckout(storage)));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
