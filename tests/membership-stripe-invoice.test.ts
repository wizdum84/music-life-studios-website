import { describe, expect, it } from "vitest";
import {
  stripeInvoiceIsRenewal,
  stripeInvoiceServicePeriod,
  stripeInvoiceSubscriptionId,
} from "../server/services/membership-stripe-invoice";

describe("Stripe membership invoice mapping", () => {
  it("reads the current API subscription parent and subscription line period", () => {
    const invoice = {
      billing_reason: "subscription_cycle",
      parent: { type: "subscription_details", subscription_details: { subscription: "sub_qa" } },
      period_start: 1796688000,
      period_end: 1796688001,
      lines: { data: [{
        parent: { type: "subscription_item_details", subscription_item_details: { subscription: "sub_qa", proration: false } },
        period: { start: 1797206400, end: 1799884800 },
      }] },
    };

    expect(stripeInvoiceSubscriptionId(invoice)).toBe("sub_qa");
    expect(stripeInvoiceServicePeriod(invoice)).toEqual({
      start: new Date("2026-12-14T00:00:00.000Z"),
      end: new Date("2027-01-14T00:00:00.000Z"),
    });
    expect(stripeInvoiceIsRenewal(invoice)).toBe(true);
  });

  it("supports legacy invoice fields", () => {
    const invoice = {
      subscription: { id: "sub_legacy" },
      billing_reason: "subscription_cycle",
      lines: { data: [{
        type: "subscription",
        subscription: "sub_legacy",
        proration: false,
        period: { start: 1797206400, end: 1799884800 },
      }] },
    };
    expect(stripeInvoiceSubscriptionId(invoice)).toBe("sub_legacy");
    expect(stripeInvoiceServicePeriod(invoice)?.end).toEqual(new Date("2027-01-14T00:00:00.000Z"));
  });

  it("does not classify the first subscription invoice as a renewal", () => {
    expect(stripeInvoiceIsRenewal({ billing_reason: "subscription_create" })).toBe(false);
  });

  it("ignores proration periods in favor of the recurring service line", () => {
    const invoice = {
      parent: { subscription_details: { subscription: "sub_qa" } },
      lines: { data: [
        {
          parent: { subscription_item_details: { subscription: "sub_qa", proration: true } },
          period: { start: 1797000000, end: 1799884800 },
        },
        {
          parent: { subscription_item_details: { subscription: "sub_qa", proration: false } },
          period: { start: 1797206400, end: 1799884800 },
        },
      ] },
    };
    expect(stripeInvoiceServicePeriod(invoice)?.start).toEqual(new Date("2026-12-14T00:00:00.000Z"));
  });
});
