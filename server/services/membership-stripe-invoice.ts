function expandableId(value: unknown): string | null {
  if (typeof value === "string" && value) return value;
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    return typeof id === "string" && id ? id : null;
  }
  return null;
}

function validUnixSeconds(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function stripeInvoiceSubscriptionId(invoice: any): string | null {
  return expandableId(invoice?.subscription)
    ?? expandableId(invoice?.parent?.subscription_details?.subscription)
    ?? null;
}

export function stripeInvoiceServicePeriod(invoice: any): { start: Date; end: Date } | null {
  const subscriptionId = stripeInvoiceSubscriptionId(invoice);
  const lines = Array.isArray(invoice?.lines?.data) ? invoice.lines.data : [];
  const subscriptionLines = lines.filter((line: any) => {
    const currentDetails = line?.parent?.subscription_item_details;
    const legacySubscriptionId = expandableId(line?.subscription)
      ?? expandableId(line?.parent?.invoice_item_details?.subscription);
    const lineSubscriptionId = expandableId(currentDetails?.subscription) ?? legacySubscriptionId;
    const isSubscriptionLine = line?.type === "subscription" || Boolean(currentDetails);
    const isProration = Boolean(line?.proration ?? currentDetails?.proration ?? line?.parent?.invoice_item_details?.proration);
    return isSubscriptionLine && !isProration && (!subscriptionId || !lineSubscriptionId || lineSubscriptionId === subscriptionId)
      && validUnixSeconds(line?.period?.start) && validUnixSeconds(line?.period?.end);
  });

  if (subscriptionLines.length > 0) {
    const start = Math.min(...subscriptionLines.map((line: any) => line.period.start));
    const end = Math.max(...subscriptionLines.map((line: any) => line.period.end));
    if (end > start) return { start: new Date(start * 1000), end: new Date(end * 1000) };
  }

  if (validUnixSeconds(invoice?.period_start) && validUnixSeconds(invoice?.period_end) && invoice.period_end > invoice.period_start) {
    return { start: new Date(invoice.period_start * 1000), end: new Date(invoice.period_end * 1000) };
  }
  return null;
}

export function stripeInvoiceIsRenewal(invoice: any): boolean {
  return invoice?.billing_reason === "subscription_cycle";
}
