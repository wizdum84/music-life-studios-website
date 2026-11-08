import { describe, expect, it } from "vitest";
import { calculatePricing } from "../shared/pricing";

const productionPricing = (productionOption: string, duration = 120) => calculatePricing({
  serviceId: 3,
  serviceName: "Custom Production With Wiz",
  duration,
  productionOption,
});

describe("custom production pricing", () => {
  it("labels and prices two custom beats as a two-beat bundle", () => {
    const pricing = productionPricing("custom-beat");
    expect(pricing).toMatchObject({ quantity: 2, unitType: "beat", finalTotal: 38000 });
  });

  it("prices Build-a-Song as one $250 project instead of inventing a per-song bundle", () => {
    const pricing = productionPricing("build-song");
    expect(pricing).toMatchObject({ quantity: 1, unitType: "project", finalTotal: 25000 });
  });

  it("keeps custom media work as a zero-dollar quote request", () => {
    const pricing = productionPricing("media-quote");
    expect(pricing).toMatchObject({ quantity: 1, unitType: "project", finalTotal: 0, requiresManualQuote: true });
  });
});
