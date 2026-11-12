import dotenv from "dotenv";

dotenv.config({ quiet: true });

const [{ storage }, stripeService, { sendBeatLicensePaymentEmails }] = await Promise.all([
  import("../server/storage"),
  import("../server/services/stripe"),
  import("../server/services/email"),
]);

const stripe = stripeService.assertStripeConfigured();
let activated = 0;

for await (const checkout of stripe.checkout.sessions.list({ limit: 100 })) {
  if (checkout.mode !== "payment" || checkout.payment_status !== "paid" || !checkout.metadata?.beatPurchaseId) continue;
  const purchase = await storage.getBeatPurchase(Number(checkout.metadata.beatPurchaseId));
  if (!purchase || purchase.licenseStatus === "active" || checkout.amount_total !== purchase.price) continue;
  const beat = await storage.getBeat(purchase.beatId);
  if (!beat) continue;

  const transactionId = typeof checkout.payment_intent === "string" ? checkout.payment_intent : checkout.id;
  const verified = await storage.updateBeatPurchaseContract(purchase.id, true, {
    transactionId,
    licenseStatus: "payment_verified",
    licenseStartDate: new Date(checkout.created * 1000),
  } as any);
  if (!verified) continue;
  const active = await storage.updateBeatPurchaseContract(purchase.id, true, { licenseStatus: "active" } as any);
  if (!active) continue;
  if (purchase.licenseType === "exclusive") {
    await storage.updateBeat(beat.id, { availabilityStatus: "exclusively_sold", availabilityUpdatedAt: new Date() });
  }
  await sendBeatLicensePaymentEmails(active, beat.title).catch((error) => {
    console.error(`Beat license payment email failed for purchase ${purchase.id}:`, error);
  });
  activated += 1;
}

console.log(`Activated ${activated} paid beat license checkout(s).`);
process.exit(0);
