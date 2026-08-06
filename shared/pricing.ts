export type PricingUnit = "hour" | "song" | "beat" | "project";

export type PricingResult = {
  serviceId: number;
  quantity: number;
  unitType: PricingUnit;
  standardUnitPrice: number;
  standardTotal: number;
  bundleDiscount: number;
  finalTotal: number;
  effectiveUnitPrice: number;
  requiresManualQuote: boolean;
  quoteReason?: string;
};

export type PricingInput = {
  serviceId: number;
  serviceName: string;
  duration: number;
  recordingOption?: string;
  mixOption?: string;
  productionOption?: string;
};

const isRecordingService = (name: string) => {
  const lower = name.toLowerCase();
  return lower.includes("record") || lower.includes("session");
};

const isMixingService = (name: string) => {
  const lower = name.toLowerCase();
  return lower.includes("mix") || lower.includes("master");
};

const isProductionService = (name: string) => {
  const lower = name.toLowerCase();
  return lower.includes("producer") || lower.includes("production") || lower.includes("composition") || lower.includes("custom");
};

const roundCents = (value: number) => Math.round(value);

export function calculatePricing(input: PricingInput): PricingResult {
  const { serviceId, serviceName, duration, recordingOption = "hourly", mixOption = "quick-finish", productionOption = "custom-beat" } = input;
  const isRecording = isRecordingService(serviceName);
  const isMixing = isMixingService(serviceName);
  const isProduction = isProductionService(serviceName);

  // Default fallback
  let quantity = 0;
  let unitType: PricingUnit = "hour";
  let standardUnitPrice = 0;
  let standardTotal = 0;
  let finalTotal = 0;
  let requiresManualQuote = false;
  let quoteReason: string | undefined;

  const songCount = Math.max(1, Math.round(duration / 60));
  const hoursCount = duration / 60;

  if (isRecording && recordingOption === "release-ready") {
    quantity = songCount;
    unitType = "song";
    const standardPrices = 22500;
    const bundlePrices: Record<number, number> = {
      1: 22500,
      2: 42500,
      3: 60000,
      4: 78000,
      5: 95000,
    };
    const includedHours: Record<number, number> = {
      1: 2,
      2: 4,
      3: 6,
      4: 8,
      5: 10,
    };

    if (quantity > 5) {
      requiresManualQuote = true;
      quoteReason = "Release-ready packages over five songs require a custom quote.";
      standardTotal = quantity * standardPrices;
      finalTotal = standardTotal;
    } else {
      standardTotal = quantity * standardPrices;
      finalTotal = bundlePrices[quantity] ?? standardTotal;
    }

    standardUnitPrice = standardPrices;
  } else if (isRecording) {
    quantity = hoursCount;
    unitType = "hour";
    standardUnitPrice = 5000;
    standardTotal = roundCents(hoursCount * standardUnitPrice);

    const bundlePricing: Record<number, number> = {
      2: 10000,
      4: 18000,
      6: 26000,
      8: 34000,
    };

    if (hoursCount > 8) {
      requiresManualQuote = true;
      quoteReason = "Recording sessions over eight hours require a custom quote.";
      finalTotal = standardTotal;
    } else if (bundlePricing[hoursCount]) {
      finalTotal = bundlePricing[hoursCount];
    } else {
      finalTotal = standardTotal;
    }
  } else if (isMixing) {
    quantity = songCount;
    unitType = "song";

    if (mixOption === "quick-finish") {
      const bundlePrices: Record<number, number> = {
        1: 7500,
        2: 14000,
        3: 20000,
        4: 25000,
        5: 30000,
      };
      standardUnitPrice = 7500;
      standardTotal = quantity * standardUnitPrice;
      if (quantity > 5) {
        requiresManualQuote = true;
        quoteReason = "Quick Finish over five songs requires a custom quote.";
        finalTotal = standardTotal;
      } else {
        finalTotal = bundlePrices[quantity] ?? standardTotal;
      }
    } else if (mixOption === "master-only") {
      const bundlePrices: Record<number, number> = {
        1: 5000,
        2: 10000,
        3: 15000,
        4: 18000,
        5: 22000,
        6: 25500,
        7: 29500,
        8: 33000,
      };
      standardUnitPrice = 5000;
      standardTotal = quantity * standardUnitPrice;
      if (quantity > 8) {
        requiresManualQuote = true;
        quoteReason = "Master Only over eight songs requires a custom quote.";
        finalTotal = standardTotal;
      } else {
        finalTotal = bundlePrices[quantity] ?? standardTotal;
      }
    } else if (mixOption === "advanced") {
      const bundlePrices: Record<number, number> = {
        1: 17500,
        2: 33500,
        3: 49500,
        4: 64000,
        5: 77500,
      };
      standardUnitPrice = 17500;
      standardTotal = quantity * standardUnitPrice;
      if (quantity > 5) {
        requiresManualQuote = true;
        quoteReason = "Advanced Mix and Master over five songs requires a custom quote.";
        finalTotal = standardTotal;
      } else {
        finalTotal = bundlePrices[quantity] ?? standardTotal;
      }
    } else {
      const bundlePrices: Record<number, number> = {
        1: 12500,
        2: 24000,
        3: 34500,
        4: 44000,
        5: 52500,
      };
      standardUnitPrice = 12500;
      standardTotal = quantity * standardUnitPrice;
      if (quantity > 5) {
        requiresManualQuote = true;
        quoteReason = "Standard Mix and Master over five songs requires a custom quote.";
        finalTotal = standardTotal;
      } else {
        finalTotal = bundlePrices[quantity] ?? standardTotal;
      }
    }
  } else if (isProduction) {
    unitType = productionOption === "custom-beat" ? "beat" : "song";
    quantity = serviceName.toLowerCase().includes("beat") ? songCount : duration === 60 ? 1 : songCount;

    if (productionOption === "media-quote") {
      unitType = "project";
      quantity = 1;
      standardUnitPrice = 0;
      standardTotal = 0;
      finalTotal = 0;
      requiresManualQuote = true;
      quoteReason = "Film, game, advertising, and complex commercial media projects require a custom quote.";
    } else if (productionOption === "custom-beat") {
      const bundlePrices: Record<number, number> = {
        1: 20000,
        2: 38000,
        3: 54000,
        4: 70000,
      };
      standardUnitPrice = 20000;
      standardTotal = quantity * standardUnitPrice;
      if (quantity > 4) {
        requiresManualQuote = true;
        quoteReason = "Custom beat packages over four beats require a custom quote.";
        finalTotal = standardTotal;
      } else {
        finalTotal = bundlePrices[quantity] ?? standardTotal;
      }
    } else if (productionOption === "complete-single") {
      const bundlePrices: Record<number, number> = {
        1: 32500,
        2: 62500,
        3: 90000,
        4: 116000,
      };
      standardUnitPrice = 32500;
      standardTotal = quantity * standardUnitPrice;
      if (quantity > 4) {
        requiresManualQuote = true;
        quoteReason = "Complete Custom Single packages over four songs require a custom quote.";
        finalTotal = standardTotal;
      } else {
        finalTotal = bundlePrices[quantity] ?? standardTotal;
      }
    } else if (productionOption === "signature-single") {
      const bundlePrices: Record<number, number> = {
        1: 45000,
        2: 87500,
        3: 127500,
        4: 164000,
      };
      standardUnitPrice = 45000;
      standardTotal = quantity * standardUnitPrice;
      if (quantity > 4) {
        requiresManualQuote = true;
        quoteReason = "Signature Custom Single packages over four songs require a custom quote.";
        finalTotal = standardTotal;
      } else {
        finalTotal = bundlePrices[quantity] ?? standardTotal;
      }
    } else {
      standardUnitPrice = 20000;
      standardTotal = quantity * standardUnitPrice;
      finalTotal = standardTotal;
    }
  } else {
    quantity = hoursCount;
    unitType = "hour";
    standardUnitPrice = 5000;
    standardTotal = roundCents(hoursCount * standardUnitPrice);
    finalTotal = standardTotal;
  }

  const bundleDiscount = Math.max(0, standardTotal - finalTotal);
  const effectiveUnitPrice = quantity > 0 ? Math.round(finalTotal / quantity) : finalTotal;

  return {
    serviceId,
    quantity,
    unitType,
    standardUnitPrice,
    standardTotal,
    bundleDiscount,
    finalTotal,
    effectiveUnitPrice,
    requiresManualQuote,
    quoteReason,
  };
}
