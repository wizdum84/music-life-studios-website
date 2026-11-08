import dotenv from "dotenv";

dotenv.config({ quiet: true });

const [{ storage }, { sendMembershipConfirmationEmail }] = await Promise.all([
  import("../server/storage"),
  import("../server/services/email"),
]);

let sent = 0;
for (const membership of await storage.getAllMembershipSubscriptions()) {
  if (membership.status !== "active") continue;
  const events = await storage.getMembershipEvents(membership.id);
  if (events.some((event) => event.eventType === "membership_activation_email_sent")) continue;
  const [user, plan] = await Promise.all([
    storage.getUser(membership.userId),
    storage.getMembershipPlan(membership.planId),
  ]);
  if (!user || !plan) continue;
  await sendMembershipConfirmationEmail(user, plan, membership);
  await storage.createMembershipEvent({
    subscriptionId: membership.id,
    eventType: "membership_activation_email_sent",
    details: JSON.stringify({ recipient: user.email, sentAt: new Date().toISOString(), source: "backfill" }),
  });
  sent += 1;
}

console.log(`Sent ${sent} missing membership activation email(s).`);
process.exit(0);
