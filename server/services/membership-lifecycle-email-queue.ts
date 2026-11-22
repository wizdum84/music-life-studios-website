import type { MembershipPlan, User } from "@shared/schema";
import { storage } from "../storage";
import { sendMembershipLifecycleEmail } from "./email";

export type MembershipLifecycleEmailKind = "renewed" | "payment_failed" | "recovered" | "cancelled";

type PendingEmailDetails = {
  kind: MembershipLifecycleEmailKind;
  effectiveDate?: string;
  recipient: string;
};

function eventTypes(kind: MembershipLifecycleEmailKind, sourceId: string) {
  const safeSourceId = sourceId.replace(/[^a-zA-Z0-9_-]/g, "_");
  return {
    pending: `membership_lifecycle_email_pending_${kind}_${safeSourceId}`,
    sent: `membership_lifecycle_email_sent_${kind}_${safeSourceId}`,
  };
}

async function deliver(
  subscriptionId: number,
  sentEventType: string,
  user: Pick<User, "email" | "firstName" | "username">,
  plan: MembershipPlan,
  details: PendingEmailDetails,
) {
  const events = await storage.getMembershipEvents(subscriptionId);
  if (events.some((event) => event.eventType === sentEventType)) return false;
  const delivered = await sendMembershipLifecycleEmail(
    user,
    plan,
    details.kind,
    details.effectiveDate ? new Date(details.effectiveDate) : undefined,
  );
  if (!delivered) return false;
  await storage.createMembershipEvent({
    subscriptionId,
    eventType: sentEventType,
    details: JSON.stringify({ ...details, sentAt: new Date().toISOString() }),
  });
  return true;
}

export async function queueMembershipLifecycleEmail(input: {
  subscriptionId: number;
  sourceId: string;
  kind: MembershipLifecycleEmailKind;
  effectiveDate?: Date | null;
}) {
  const membership = (await storage.getAllMembershipSubscriptions()).find((item) => item.id === input.subscriptionId);
  if (!membership) return false;
  const [user, plan, events] = await Promise.all([
    storage.getUser(membership.userId),
    storage.getMembershipPlan(membership.planId),
    storage.getMembershipEvents(input.subscriptionId),
  ]);
  if (!user || !plan) return false;

  const types = eventTypes(input.kind, input.sourceId);
  const details: PendingEmailDetails = {
    kind: input.kind,
    ...(input.effectiveDate ? { effectiveDate: input.effectiveDate.toISOString() } : {}),
    recipient: user.email,
  };
  if (!events.some((event) => event.eventType === types.pending)) {
    await storage.createMembershipEvent({
      subscriptionId: input.subscriptionId,
      eventType: types.pending,
      details: JSON.stringify({ ...details, queuedAt: new Date().toISOString() }),
    });
  }

  try {
    return await deliver(input.subscriptionId, types.sent, user, plan, details);
  } catch (error) {
    console.error(`Membership lifecycle email queued for retry (${types.pending}):`, error);
    return false;
  }
}

export async function retryPendingMembershipLifecycleEmails() {
  let sentCount = 0;
  for (const membership of await storage.getAllMembershipSubscriptions()) {
    const events = await storage.getMembershipEvents(membership.id);
    const [user, plan] = await Promise.all([
      storage.getUser(membership.userId),
      storage.getMembershipPlan(membership.planId),
    ]);
    if (!user || !plan) continue;

    for (const pending of events.filter((event) => event.eventType.startsWith("membership_lifecycle_email_pending_"))) {
      const sentEventType = pending.eventType.replace("membership_lifecycle_email_pending_", "membership_lifecycle_email_sent_");
      if (events.some((event) => event.eventType === sentEventType)) continue;
      let details: PendingEmailDetails;
      try {
        details = JSON.parse(pending.details || "{}") as PendingEmailDetails;
      } catch {
        continue;
      }
      if (!details.kind || !details.recipient) continue;
      try {
        if (await deliver(membership.id, sentEventType, user, plan, details)) sentCount += 1;
      } catch (error) {
        console.error(`Membership lifecycle email still pending (${pending.eventType}):`, error);
      }
    }
  }
  return sentCount;
}
