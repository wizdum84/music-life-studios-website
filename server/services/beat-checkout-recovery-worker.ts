import { storage } from "../storage";
import { createBeatLicenseCheckoutSession, expireCheckoutSession, retrieveCheckoutSession } from "./stripe";
import { sendBeatLicenseRecoveryEmail } from "./email";

const RECOVERY_AFTER_MS = 24 * 60 * 60 * 1000;
const RECOVERY_DISCOUNT_PERCENT = 5;
let scanning = false;

async function sendPendingRecovery(purchase: Awaited<ReturnType<typeof storage.getBeatPurchase>>) {
  if (!purchase || purchase.licenseStatus !== "recovery_pending" || !purchase.transactionId.startsWith("recovery:")) return;
  const checkout = await retrieveCheckoutSession(purchase.transactionId.slice("recovery:".length));
  const beat = await storage.getBeat(purchase.beatId);
  if (!beat || !checkout.url) return;
  if (await sendBeatLicenseRecoveryEmail(purchase, beat.title, checkout.url, RECOVERY_DISCOUNT_PERCENT)) {
    await storage.updateBeatPurchaseContract(purchase.id, true, { licenseStatus: "recovery_sent" } as any);
  }
}

export async function scanBeatCheckoutRecoveries(now = new Date()) {
  if (scanning) return;
  scanning = true;
  try {
    const purchases = await storage.getAllBeatPurchases();
    for (const purchase of purchases) {
      if (purchase.licenseStatus === "recovery_pending") {
        await sendPendingRecovery(purchase);
        continue;
      }
      if (purchase.licenseStatus !== "pending" || now.getTime() - purchase.purchaseDate.getTime() < RECOVERY_AFTER_MS) continue;
      if (!purchase.transactionId.startsWith("checkout:")) {
        await storage.updateBeatPurchaseContract(purchase.id, true, { licenseStatus: "abandoned" } as any);
        continue;
      }
      const sessionId = purchase.transactionId.slice("checkout:".length);
      const originalCheckout = await retrieveCheckoutSession(sessionId);
      if (originalCheckout.payment_status === "paid") continue;
      if (originalCheckout.status === "open") await expireCheckoutSession(sessionId);
      const beat = await storage.getBeat(purchase.beatId);
      const origin = (process.env.APP_ORIGIN || "").replace(/\/$/, "");
      if (!beat || !origin) continue;
      const recoveryCheckout = await createBeatLicenseCheckoutSession({
        purchaseId: purchase.id, beatId: purchase.beatId, beatTitle: beat.title,
        licenseType: purchase.licenseType, customerEmail: purchase.customerEmail,
        priceCents: purchase.price, recoveryDiscountPercent: RECOVERY_DISCOUNT_PERCENT,
        successUrl: `${origin}/account?tab=bookings&beat_checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/beats?beat_checkout=cancelled`,
      });
      const pending = await storage.updateBeatPurchaseContract(purchase.id, true, {
        licenseStatus: "recovery_pending", transactionId: `recovery:${recoveryCheckout.id}`,
      } as any);
      await sendPendingRecovery(pending);
    }
  } catch (error) {
    console.error("Beat checkout recovery scan failed", error);
  } finally {
    scanning = false;
  }
}

export function startBeatCheckoutRecoveryWorker() {
  void scanBeatCheckoutRecoveries();
  const timer = setInterval(() => void scanBeatCheckoutRecoveries(), 15 * 60 * 1000);
  timer.unref?.();
  return timer;
}
