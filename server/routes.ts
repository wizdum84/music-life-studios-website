import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBookingSchema, insertMessageSchema, insertMembershipSubscriptionSchema } from "@shared/schema";
import { calculatePricing } from "@shared/pricing";
import {
  MEMBERSHIP_CANCELLATION_LANGUAGE,
  MEMBERSHIP_LAUNCH_RULES,
  MEMBERSHIP_PLAN_CATALOG,
  MEMBERSHIP_POSITIONING,
  getMembershipCatalogByTier,
} from "@shared/membership";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import * as braintreeService from "./services/braintree";
import * as emailService from "./services/email";
import { setupAuth } from "./auth";

// Create default contracts if they don't exist
async function ensureContractsExist() {
  try {
    // Check if we already have a studio rules contract
    const existingRules = await storage.getContractsByCategory("studio_rules");
    
    if (!existingRules || existingRules.length === 0) {
      // Create default studio rules contract
      const description = `MUSIC LIFE STUDIOS - STUDIO RULES & POLICIES

BOOKING & CANCELLATION:
- A 25% non-refundable deposit is required to secure all bookings.
- Cancellations must be made at least 48 hours in advance for rescheduling.
- Late cancellations (less than 48 hours) forfeit the deposit.
- Arriving more than 30 minutes late may result in a shortened session or cancellation with no refund.

STUDIO CONDUCT:
- No smoking, vaping, or illegal substances permitted in the studio.
- Food and drinks are only allowed in designated areas.
- Treat all equipment with care. Clients will be held responsible for damage caused by negligence.
- Maximum occupancy: 8 people unless previously arranged.
- Keep noise levels reasonable in common areas.

RECORDING & PRODUCTION:
- Bring all necessary files on a reliable USB drive or portable hard drive.
- Files should be organized and properly labeled.
- Backup your projects. The studio is not responsible for lost data.
- Engineer breaks: 10 minutes per 2 hours of recording.

POST-SESSION:
- Session files will be stored for 30 days after recording.
- Final mixes will be provided in formats requested by the client.
- Minor revisions (up to 3) are included in mixing packages.
- Major revisions may incur additional costs.

By signing this agreement, you acknowledge you have read and agree to comply with all studio rules and policies.`;

      await storage.createContract({
        title: "Studio Rules & Policies",
        description,
        content: description,
        fileUrl: "https://storage.googleapis.com/musiclifestudios/contracts/studio_rules.pdf",
        fileType: "pdf",
        category: "studio_rules",
      });
      
      console.log("Default studio rules contract created");
    }
    
    // Check if we already have a mixing & mastering contract
    const existingMixingContracts = await storage.getContractsByCategory("mixing_mastering");
    
    if (!existingMixingContracts || existingMixingContracts.length === 0) {
      // Create default mixing & mastering contract
      const description = `MUSIC LIFE STUDIOS - MIXING & MASTERING AGREEMENT

FILE REQUIREMENTS:
- All audio files must be provided as WAV or AIFF files (minimum 44.1kHz, 24-bit).
- Files should be properly labeled (e.g., "01_Kick.wav", "02_Snare.wav").
- All files must be consolidated from the start of the project to ensure proper alignment.
- Include a rough mix reference if available.
- Please include notes on your creative vision for the final product.

REVISION POLICY:
- Two rounds of revisions are included in the base price.
- Additional revision rounds will be charged at 25% of the original fee per round.
- Minor tweaks count as a single revision if submitted together.
- Revision requests must be specific and detailed.

TIMELINE & DELIVERY:
- Standard turnaround time is 5-7 business days per track from receipt of complete files.
- Rush service is available for an additional fee, subject to availability.
- Final files will be delivered as WAV (44.1kHz, 24-bit) and MP3 (320kbps).
- Files will be delivered via secure download link.

RIGHTS & USAGE:
- You retain all rights to your original composition and recordings.
- Music Life Studios retains the right to use the mixed/mastered tracks for promotional purposes.
- We may list your project in our portfolio unless you explicitly request otherwise.
- Stems and individual track exports are available for an additional fee.

PAYMENT TERMS:
- A 50% non-refundable deposit is required to secure your booking for mixing/mastering services.
- The remaining balance is due before the final files are delivered.
- No refunds will be issued after the mixing/mastering process has begun.

By signing this agreement, you acknowledge that you understand and will abide by this mixing and mastering agreement.`;

      await storage.createContract({
        title: "Mixing & Mastering Agreement",
        description,
        content: description,
        fileUrl: "https://storage.googleapis.com/musiclifestudios/contracts/mixing_mastering.pdf",
        fileType: "pdf",
        category: "mixing_mastering",
      });
      
      console.log("Default mixing & mastering contract created");
    }

    const existingMembershipContracts = await storage.getContractsByCategory("membership_agreement");

    if (!existingMembershipContracts || existingMembershipContracts.length === 0) {
      const description = `MUSIC LIFE STUDIOS - ARTIST MEMBERSHIP AGREEMENT

MEMBERSHIP POSITIONING:
${MEMBERSHIP_POSITIONING}

MONTH-TO-MONTH TERMS:
- Memberships are month-to-month unless the customer affirmatively chooses an optional prepaid package.
- Only one monthly payment is due at enrollment for month-to-month memberships.
- There is no minimum-term commitment.
- There is no early-cancellation fee.
- There is no cancellation penalty.
- Monthly renewal continues only until valid cancellation.
- Cancellation stops future billing.
- Membership benefits remain active through the current paid-through date unless terminated for fraud, abuse, chargeback, or serious policy violation.
- No new benefits are issued after the paid-through date.

CANCELLATION:
${MEMBERSHIP_CANCELLATION_LANGUAGE}

BENEFITS AND BOOKING:
- Membership does not guarantee a specific date or time.
- Priority booking means earlier access or priority within available openings; it does not displace confirmed bookings.
- Members must follow normal booking, lateness, cancellation, rescheduling, and no-show policies.
- Late cancellations and no-shows may deduct the reserved membership hours or benefit.
- Unused benefits have no cash value and are non-transferable.
- Only unused included recording hours may roll over, subject to the member tier cap and expiration rules.
- Quick Finishes, Master Only credits, planning sessions, project reviews, and discounts do not roll over unless separately approved in writing.

DISCOUNTS:
- Membership discounts do not stack with promo codes unless the promotion is explicitly marked stackable.
- Discounts cannot reduce a transaction below zero.
- Discounts do not apply while the membership is paused, past due, canceled after the paid-through date, or terminated.
- Discounts do not apply to full-rights buyouts, work-for-hire transfers, film, game, advertising, or custom commercial media unless manually approved.

FAILED PAYMENT:
- Failed recurring payment marks the membership past due.
- New benefits are not issued while payment is past due.
- Benefit redemption pauses until verified payment.
- Payment and membership status remain separately auditable.

PAUSE:
- Launch rule: one pause per six-month period, lasting one billing cycle.
- No charge is due during the paused cycle.
- No new benefits are issued during the pause.
- Eligible rollover recording hours are frozen during the pause and resume when membership reactivates.
- The customer may cancel during the pause.

SIGNATURE AND PAYMENT:
- Signing does not confirm membership until payment is verified.
- Recurring-payment authorization is handled through the connected payment provider when enabled.
- In this build, admin payment verification is required before activation.`;

      await storage.createContract({
        title: "Artist Membership Agreement",
        description,
        content: description,
        fileUrl: "https://storage.googleapis.com/musiclifestudios/contracts/artist_membership_agreement.pdf",
        fileType: "pdf",
        category: "membership_agreement",
      });

      console.log("Default membership agreement contract created");
    }
  } catch (error) {
    console.error("Error creating default contracts:", error);
  }
}

async function ensureServicesExist() {
  // Ensure default services exist in the database or memory storage
  try {
    const existingServices = await storage.getAllServices();
    if (!existingServices || existingServices.length === 0) {
      await storage.createService({
        name: "Book a Session With Wiz",
        description: "Professional recording starts at $50 per hour with a two-hour minimum. Book hourly time with Wiz or choose a release-ready song package when you want recording, mix, and master handled together.",
        price: 5000,
        duration: 60,
        features: ["Two-hour minimum", "4-hour block: $180", "Vocal chain, effects, and reference MP3"]
      });

      await storage.createService({
        name: "Mix and Master With Wiz",
        description: "Choose Quick Finish, full mixing, advanced mixing, master-only, or project-based mixing for singles, EPs, and albums recorded with Wiz or elsewhere.",
        price: 7500,
        duration: 60,
        features: ["Quick Finish from $75", "Full mix/master from $125", "Master only: $50"]
      });

      await storage.createService({
        name: "Custom Production With Wiz",
        description: "Request original music for artists, films, YouTube videos, podcasts, games, advertisements, and other media projects.",
        price: 20000,
        duration: 60,
        features: ["Custom beats from $200", "Complete singles from $325", "Media projects quoted after review"]
      });

      console.log("Default services seeded");
    }
  } catch (err) {
    console.error("Error seeding default services:", err);
  }
}

async function ensureMembershipPlansExist() {
  try {
    for (const catalogPlan of MEMBERSHIP_PLAN_CATALOG) {
      let plan = await storage.getMembershipPlanByTier(catalogPlan.tier);
      if (!plan) {
        plan = await storage.createMembershipPlan({
          name: catalogPlan.name,
          description: catalogPlan.description,
          tier: catalogPlan.tier,
          priceCents: catalogPlan.monthlyPriceCents,
          billingInterval: "monthly",
          active: true,
        });
      }

      const activeVersion = await storage.getActiveMembershipPlanVersion(plan.id);
      if (!activeVersion) {
        await storage.createMembershipPlanVersion({
          planId: plan.id,
          versionNumber: 1,
          priceCents: catalogPlan.monthlyPriceCents,
          benefits: JSON.stringify({
            positioning: MEMBERSHIP_POSITIONING,
            cancellationLanguage: MEMBERSHIP_CANCELLATION_LANGUAGE,
            benefits: catalogPlan.benefits,
            prepaidThreeMonthPriceCents: catalogPlan.prepaidThreeMonthPriceCents,
            launchRules: MEMBERSHIP_LAUNCH_RULES,
          }),
          active: true,
          effectiveDate: new Date(),
        });
      }

      const existingDefinitions = await storage.getMembershipBenefitDefinitions(plan.id);
      for (const definition of catalogPlan.benefitDefinitions) {
        if (!existingDefinitions.some((existing) => existing.code === definition.code)) {
          await storage.createMembershipBenefitDefinition({
            planId: plan.id,
            code: definition.code,
            description: definition.description,
            quantity: definition.quantity,
            rolloverAllowed: definition.rolloverAllowed,
            rolloverLimit: definition.rolloverLimit,
            expiresAfterCycles: definition.expiresAfterCycles,
          });
        }
      }

      const existingDiscounts = await storage.getMembershipDiscounts(plan.id);
      for (const discount of catalogPlan.discounts) {
        if (!existingDiscounts.some((existing) => existing.discountValue === discount.discountValue && existing.eligibleServices.join(",") === discount.eligibleServices.join(","))) {
          await storage.createMembershipDiscount({
            planId: plan.id,
            discountType: discount.discountType,
            discountValue: discount.discountValue,
            eligibleServices: discount.eligibleServices,
            stackable: discount.stackable,
            expiresAt: null,
          });
        }
      }

      const existingMilestones = await storage.getMembershipLoyaltyMilestones(plan.id);
      if (!existingMilestones.some((milestone) => milestone.thresholdMonths === MEMBERSHIP_LAUNCH_RULES.loyaltyMilestoneMonths)) {
        await storage.createMembershipLoyaltyMilestone({
          planId: plan.id,
          name: "Three consecutive paid months",
          thresholdMonths: MEMBERSHIP_LAUNCH_RULES.loyaltyMilestoneMonths,
          rewardType: MEMBERSHIP_LAUNCH_RULES.loyaltyRewardType,
          rewardQuantity: MEMBERSHIP_LAUNCH_RULES.loyaltyRewardQuantity,
          expiresAfterCycles: MEMBERSHIP_LAUNCH_RULES.loyaltyRewardExpiresAfterCycles,
          active: true,
        });
      }
    }

    console.log("Membership plans and launch configuration ensured");
  } catch (error) {
    if ((error as any)?.code === "42P01") {
      console.error("Membership tables are missing from the connected database. Run `npm run db:push` after confirming DATABASE_URL points to the database you want to update.");
      return;
    }

    console.error("Error creating default membership plans:", error);
  }
}

function parseServicePath(details?: string | null) {
  const path = details?.match(/^Service path:\s*(.+)$/m)?.[1]?.trim();

  return {
    recordingOption: path === "release-ready" ? "release-ready" : "hourly",
    mixOption: path && ["quick-finish", "master-only", "advanced", "standard"].includes(path) ? path : "quick-finish",
    productionOption: path && ["custom-beat", "complete-single", "signature-single", "media-quote"].includes(path) ? path : "custom-beat",
  };
}

async function calculateServerBookingPricing(serviceId: number, duration: number, details?: string | null) {
  const service = await storage.getService(serviceId);
  if (!service) {
    return { service: null, pricing: null };
  }

  const options = parseServicePath(details);
  const pricing = calculatePricing({
    serviceId: service.id,
    serviceName: service.name,
    duration,
    ...options,
  });

  return { service, pricing };
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function addBillingCycles(date: Date, cycles: number) {
  return cycles > 0 ? addMonths(date, cycles) : null;
}

async function getMembershipAccountPayload(userId: number) {
  const subscription = await storage.getUserMembership(userId);
  if (!subscription) {
    return {
      subscription: null,
      plan: null,
      planVersion: null,
      catalog: null,
      benefitDefinitions: [],
      benefitLedger: [],
      balances: [],
      billingPeriods: [],
      redemptions: [],
      discounts: [],
      events: [],
      pauses: [],
      milestones: [],
      rewards: [],
      rules: MEMBERSHIP_LAUNCH_RULES,
      positioning: MEMBERSHIP_POSITIONING,
      cancellationLanguage: MEMBERSHIP_CANCELLATION_LANGUAGE,
    };
  }

  const plan = await storage.getMembershipPlan(subscription.planId);
  const planVersion = subscription.planVersionId
    ? (await storage.getMembershipPlanVersions(subscription.planId)).find((version) => version.id === subscription.planVersionId) ?? null
    : await storage.getActiveMembershipPlanVersion(subscription.planId) ?? null;
  const benefitDefinitions = await storage.getMembershipBenefitDefinitions(subscription.planId);
  const benefitLedger = await storage.getMembershipBenefitLedger(subscription.id);
  const billingPeriods = await storage.getMembershipBillingPeriods(subscription.id);
  const redemptions = await storage.getMembershipRedemptions(subscription.id);
  const discounts = await storage.getMembershipDiscounts(subscription.planId);
  const events = await storage.getMembershipEvents(subscription.id);
  const pauses = await storage.getMembershipPauses(subscription.id);
  const milestones = await storage.getMembershipLoyaltyMilestones(subscription.planId);
  const rewards = await storage.getMembershipLoyaltyRewards(subscription.id);

  const balances = benefitDefinitions.map((definition) => {
    const entries = benefitLedger
      .filter((entry) => entry.benefitDefinitionId === definition.id)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const latest = entries[entries.length - 1];

    return {
      benefitDefinitionId: definition.id,
      code: definition.code,
      description: definition.description,
      quantityIssued: definition.quantity,
      rolloverAllowed: definition.rolloverAllowed,
      rolloverLimit: definition.rolloverLimit,
      balance: latest ? latest.balanceAfter : 0,
      expiresAt: definition.expiresAfterCycles > 0 ? addBillingCycles(subscription.currentPeriodEnd, definition.expiresAfterCycles - 1) : subscription.currentPeriodEnd,
    };
  });

  return {
    subscription,
    plan: plan ?? null,
    planVersion,
    catalog: getMembershipCatalogByTier(plan?.tier),
    benefitDefinitions,
    benefitLedger,
    balances,
    billingPeriods,
    redemptions,
    discounts,
    events,
    pauses,
    milestones,
    rewards,
    rules: MEMBERSHIP_LAUNCH_RULES,
    positioning: MEMBERSHIP_POSITIONING,
    cancellationLanguage: MEMBERSHIP_CANCELLATION_LANGUAGE,
  };
}

async function issueMembershipBenefits(subscriptionId: number, planId: number, referenceType: string, referenceId: number | null, notes: string) {
  const definitions = await storage.getMembershipBenefitDefinitions(planId);

  for (const definition of definitions) {
    await storage.createMembershipBenefitLedger({
      subscriptionId,
      benefitDefinitionId: definition.id,
      action: "credit",
      quantity: definition.quantity,
      balanceBefore: 0,
      balanceAfter: definition.quantity,
      referenceType,
      referenceId,
      notes,
    });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Ensure all contracts and membership plans exist when the server starts
  await ensureContractsExist();
  await ensureServicesExist();
  await ensureMembershipPlansExist();
  
  // Set up authentication with the new auth module
  setupAuth(app);
  
  // Authentication middleware
  const isAuthenticated = (req: Request, res: Response, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };
  
  // API routes
  
  // Services API
  app.get("/api/services", async (req, res) => {
    try {
      const services = await storage.getAllServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Error fetching services" });
    }
  });
  
  app.get("/api/services/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const service = await storage.getService(id);
      
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      res.json(service);
    } catch (error) {
      res.status(500).json({ message: "Error fetching service" });
    }
  });

  app.post("/api/pricing/calculate", async (req, res) => {
    try {
      const { serviceId, duration, recordingOption, mixOption, productionOption } = req.body;
      const parsedServiceId = parseInt(serviceId, 10);
      const parsedDuration = parseInt(duration, 10);

      if (!Number.isFinite(parsedServiceId) || !Number.isFinite(parsedDuration)) {
        return res.status(400).json({ error: "Service ID and duration are required" });
      }

      const service = await storage.getService(parsedServiceId);
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }

      const pricing = calculatePricing({
        serviceId: service.id,
        serviceName: service.name,
        duration: parsedDuration,
        recordingOption,
        mixOption,
        productionOption,
      });

      res.json(pricing);
    } catch (error) {
      console.error("Error calculating pricing:", error);
      res.status(500).json({ error: "Failed to calculate pricing" });
    }
  });
  
  // Tracks/Portfolio API
  app.get("/api/tracks", async (req, res) => {
    try {
      const tracks = await storage.getAllTracks();
      res.json(tracks);
    } catch (error) {
      res.status(500).json({ message: "Error fetching tracks" });
    }
  });
  
  // Beats API routes
  
  // Get all beats
  app.get("/api/beats", async (req, res) => {
    try {
      const beats = await storage.getAllBeats();
      res.json(beats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get featured beats
  app.get("/api/beats/featured", async (req, res) => {
    try {
      const beats = await storage.getFeaturedBeats();
      res.json(beats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get beats by genre
  app.get("/api/beats/genre/:genre", async (req, res) => {
    try {
      const { genre } = req.params;
      const beats = await storage.getBeatsByGenre(genre);
      res.json(beats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get single beat by ID
  app.get("/api/beats/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const beat = await storage.getBeat(parseInt(id));
      if (!beat) {
        return res.status(404).json({ error: "Beat not found" });
      }
      res.json(beat);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Create beat (admin only)
  app.post("/api/beats", isAuthenticated, async (req, res) => {
    try {
      const beat = await storage.createBeat(req.body);
      res.status(201).json(beat);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Update beat (admin only)
  app.put("/api/beats/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const beat = await storage.updateBeat(parseInt(id), req.body);
      if (!beat) {
        return res.status(404).json({ error: "Beat not found" });
      }
      res.json(beat);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Delete beat (admin only)
  app.delete("/api/beats/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteBeat(parseInt(id));
      if (!success) {
        return res.status(404).json({ error: "Beat not found" });
      }
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Beat Purchases API routes
  
  // Get all beat purchases (for analytics)
  app.get("/api/beat-purchases", isAuthenticated, async (req, res) => {
    try {
      const purchases = await storage.getAllBeatPurchases();
      res.json(purchases);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Create beat purchase
  app.post("/api/beat-purchases", async (req, res) => {
    try {
      const purchase = await storage.createBeatPurchase(req.body);
      res.status(201).json(purchase);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get purchases by email (for customer to view their purchases)
  app.get("/api/beat-purchases/email/:email", async (req, res) => {
    try {
      const { email } = req.params;
      const purchases = await storage.getBeatPurchasesByEmail(email);
      res.json(purchases);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Update beat purchase contract status
  app.put("/api/beat-purchases/:id/contract", async (req, res) => {
    try {
      const { id } = req.params;
      const { contractSigned } = req.body;
      const purchase = await storage.updateBeatPurchaseContract(parseInt(id), contractSigned);
      if (!purchase) {
        return res.status(404).json({ error: "Purchase not found" });
      }
      res.json(purchase);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Increment beat purchase download count
  app.post("/api/beat-purchases/:id/download", async (req, res) => {
    try {
      const { id } = req.params;
      const purchase = await storage.incrementBeatPurchaseDownloadCount(parseInt(id));
      if (!purchase) {
        return res.status(404).json({ error: "Purchase not found" });
      }
      res.json(purchase);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Booking API
  app.post("/api/bookings", async (req, res) => {
    try {
      const booking = insertBookingSchema.parse(req.body);
      const { pricing } = await calculateServerBookingPricing(booking.serviceId, booking.duration, booking.details);

      if (!pricing) {
        return res.status(404).json({ message: "Service not found" });
      }

      if (pricing.requiresManualQuote && req.body.status === "pending" && req.body.paymentStatus === "unpaid") {
        const createdBooking = await storage.createBooking({
          ...booking,
          amount: 0,
          status: "pending",
        });

        if (req.body.timeSlotId) {
          await storage.bookTimeSlot(req.body.timeSlotId, createdBooking.id);
        }

        return res.status(201).json({ ...createdBooking, pricing });
      }

      if (pricing.requiresManualQuote) {
        return res.status(400).json({
          message: "This selection requires a custom quote before checkout.",
          pricing,
        });
      }

      const createdBooking = await storage.createBooking({
        ...booking,
        amount: pricing.finalTotal,
      });
      
      // If a time slot ID is provided, book the time slot
      if (req.body.timeSlotId) {
        await storage.bookTimeSlot(req.body.timeSlotId, createdBooking.id);
      }
      
      res.status(201).json(createdBooking);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: fromZodError(error).message 
        });
      }
      res.status(500).json({ message: "Error creating booking" });
    }
  });
  
  // Get the payment status of a booking, used to return and complete payment or add tip
  app.get("/api/bookings/:id/payment-status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const booking = await storage.getBooking(id);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Get the client token for new payments if needed
      const clientToken = await braintreeService.generateClientToken();
      
      res.json({
        booking: {
          id: booking.id,
          serviceId: booking.serviceId,
          date: booking.date,
          amount: booking.amount,
          name: booking.name,
          email: booking.email,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          transactionId: booking.transactionId,
          tipAmount: booking.tipAmount
        },
        clientToken,
        // Calculate how much is left to pay if it's a deposit
        remainingAmount: booking.paymentStatus === 'deposit_paid' 
          ? booking.amount - (booking.amount * 0.25) 
          : 0
      });
    } catch (error: any) {
      res.status(500).json({ 
        message: "Error fetching booking payment status", 
        error: error.message 
      });
    }
  });
  
  app.get("/api/bookings", isAuthenticated, async (req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Error fetching bookings" });
    }
  });
  
  // Get bookings for logged in user
  app.get("/api/user/bookings", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const bookings = await storage.getUserBookings(userId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching user bookings:", error);
      res.status(500).json({ error: "Failed to fetch user bookings" });
    }
  });
  
  // Get loyalty data for logged in user
  app.get("/api/user/loyalty", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      // Get loyalty records
      const loyaltyRecords = await storage.getLoyaltyRecords(userId);
      
      // Get user to get session count and points
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({
        points: user.loyaltyPoints || 0,
        sessionCount: user.sessionCount || 0,
        records: loyaltyRecords
      });
    } catch (error) {
      console.error("Error fetching user loyalty data:", error);
      res.status(500).json({ error: "Failed to fetch loyalty data" });
    }
  });
  
  // Get active promotions for members
  app.get("/api/promotions/active", isAuthenticated, async (req, res) => {
    try {
      const promotions = await storage.getActivePromotions();
      res.json(promotions);
    } catch (error) {
      console.error("Error fetching active promotions:", error);
      res.status(500).json({ error: "Failed to fetch promotions" });
    }
  });
  
  app.get("/api/bookings/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const booking = await storage.getBooking(id);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Error fetching booking" });
    }
  });
  
  app.patch("/api/bookings/:id/status", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !["pending", "confirmed", "completed", "cancelled"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      const updatedBooking = await storage.updateBooking(id, { status });
      res.json(updatedBooking);
    } catch (error) {
      res.status(500).json({ message: "Error updating booking status" });
    }
  });
  
  // Time Slots API
  app.get("/api/time-slots", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        const allSlots = await storage.getAllTimeSlots();
        return res.json(allSlots);
      }
      
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      const availableSlots = await storage.getAvailableTimeSlots(start, end);
      res.json(availableSlots);
    } catch (error) {
      res.status(500).json({ message: "Error fetching time slots" });
    }
  });
  
  // Contact form API
  app.post("/api/contact", async (req, res) => {
    try {
      const message = insertMessageSchema.parse(req.body);
      const createdMessage = await storage.createMessage(message);
      res.status(201).json(createdMessage);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: fromZodError(error).message 
        });
      }
      res.status(500).json({ message: "Error sending message" });
    }
  });
  
  app.get("/api/messages", isAuthenticated, async (req, res) => {
    try {
      const messages = await storage.getAllMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Error fetching messages" });
    }
  });
  
  app.patch("/api/messages/:id/read", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedMessage = await storage.markMessageAsRead(id);
      
      if (!updatedMessage) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      res.json(updatedMessage);
    } catch (error) {
      res.status(500).json({ message: "Error marking message as read" });
    }
  });
  
  // Braintree Payment API
  app.get("/api/braintree/client-token", async (req, res) => {
    try {
      const clientToken = await braintreeService.generateClientToken();
      res.json({ clientToken });
    } catch (error: any) {
      res.status(500).json({ 
        message: "Error generating client token", 
        error: error.message 
      });
    }
  });

  app.post("/api/braintree/process-payment", async (req, res) => {
    try {
      const { 
        bookingId, 
        paymentMethodNonce, 
        isDeposit = false,
        tipAmount = 0
      } = req.body;
      
      if (!bookingId || !paymentMethodNonce) {
        return res.status(400).json({ 
          message: "Missing required fields" 
        });
      }
      
      // Get the booking information
      const booking = await storage.getBooking(parseInt(bookingId));
      
      if (!booking) {
        return res.status(404).json({ 
          message: "Booking not found" 
        });
      }
      
      // Process the payment
      const result = await braintreeService.processPayment(
        booking,
        paymentMethodNonce,
        isDeposit
      );
      
      if (result.success && result.transaction) {
        // Update booking with transaction information
        const updatedBooking = await storage.updateBookingTransactionInfo(booking.id, {
          transactionId: result.transaction.id,
          paymentStatus: result.paymentStatus,
          paymentMethod: result.transaction.paymentInstrumentType,
          paymentMetadata: result.transaction,
          tipAmount: tipAmount > 0 ? tipAmount : undefined
        });
        
        // Send confirmation emails
        if (updatedBooking) {
          await emailService.sendClientConfirmationEmail(
            updatedBooking, 
            result.transaction.id
          );
          
          await emailService.sendAdminNotificationEmail(
            updatedBooking, 
            result.transaction.id
          );
        }
        
        res.json({
          success: true,
          transaction: {
            id: result.transaction.id,
            status: result.transaction.status,
            amount: result.transaction.amount
          },
          booking: updatedBooking
        });
      } else {
        // Update booking with error information if needed
        await storage.updateBookingTransactionInfo(booking.id, {
          transactionId: 'error',
          paymentStatus: 'failed',
          paymentErrorMessage: result.errorMessage
        });
        
        res.status(400).json({
          success: false,
          message: result.errorMessage,
          errors: result.errors
        });
      }
    } catch (error: any) {
      res.status(500).json({ 
        message: "Error processing payment", 
        error: error.message 
      });
    }
  });
  
  // Admin-only refund endpoint
  app.post("/api/braintree/refund", isAuthenticated, async (req, res) => {
    try {
      const { transactionId, amount } = req.body;
      
      if (!transactionId) {
        return res.status(400).json({ 
          message: "Transaction ID is required" 
        });
      }
      
      const result = await braintreeService.refundTransaction(
        transactionId, 
        amount
      );
      
      if (result.success && result.transaction) {
        // Find booking by transactionId and update it
        const bookings = await storage.getAllBookings();
        const booking = bookings.find(b => b.transactionId === transactionId);
        
        if (booking) {
          await storage.updateBookingTransactionInfo(booking.id, {
            transactionId: result.transaction.id,
            paymentStatus: 'refunded'
          });
        }
        
        res.json({
          success: true,
          transaction: {
            id: result.transaction.id,
            status: result.transaction.status,
            amount: result.transaction.amount
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.errorMessage
        });
      }
    } catch (error: any) {
      res.status(500).json({ 
        message: "Error processing refund", 
        error: error.message 
      });
    }
  });
  
  // Add a tip to a booking
  app.post("/api/braintree/add-tip", async (req, res) => {
    try {
      const { 
        bookingId, 
        paymentMethodNonce, 
        tipAmount 
      } = req.body;
      
      if (!bookingId || !paymentMethodNonce || !tipAmount) {
        return res.status(400).json({ 
          message: "Missing required fields" 
        });
      }
      
      // Get the booking information
      const booking = await storage.getBooking(parseInt(bookingId));
      
      if (!booking) {
        return res.status(404).json({ 
          message: "Booking not found" 
        });
      }
      
      // Create a modified booking object with the tip amount
      const tipBooking = {
        ...booking,
        amount: tipAmount  // Override the amount with just the tip amount
      };
      
      // Process the tip payment
      const result = await braintreeService.processPayment(
        tipBooking,
        paymentMethodNonce,
        false
      );
      
      if (result.success && result.transaction) {
        // Update booking with tip information
        const updatedBooking = await storage.updateBookingTransactionInfo(booking.id, {
          transactionId: result.transaction.id,
          paymentStatus: booking.paymentStatus || "unpaid",  // Keep the original payment status
          paymentMethod: result.transaction.paymentInstrumentType,
          tipAmount: tipAmount
        });
        
        res.json({
          success: true,
          transaction: {
            id: result.transaction.id,
            status: result.transaction.status,
            amount: result.transaction.amount
          },
          booking: updatedBooking
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.errorMessage,
          errors: result.errors
        });
      }
    } catch (error: any) {
      res.status(500).json({ 
        message: "Error processing tip", 
        error: error.message 
      });
    }
  });

  // Contract Management API
  app.get("/api/contracts", async (req, res) => {
    try {
      const { category } = req.query;
      
      if (category) {
        const contracts = await storage.getContractsByCategory(category as string);
        return res.json(contracts);
      }
      
      const activeOnly = req.query.activeOnly === 'true';
      if (activeOnly) {
        const activeContracts = await storage.getActiveContracts();
        return res.json(activeContracts);
      }
      
      const contracts = await storage.getAllContracts();
      res.json(contracts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching contracts" });
    }
  });
  
  app.get("/api/contracts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contract = await storage.getContract(id);
      
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      
      res.json(contract);
    } catch (error) {
      res.status(500).json({ message: "Error fetching contract" });
    }
  });
  
  app.post("/api/contracts", isAuthenticated, async (req, res) => {
    try {
      const { title, description, content, fileUrl, fileType, category } = req.body;
      
      if (!title || !description || !fileUrl) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const newContract = await storage.createContract({
        title,
        description,
        content: content || description,
        fileUrl,
        fileType: fileType || "pdf",
        category: category || "licensing"
      });
      
      res.status(201).json(newContract);
    } catch (error) {
      res.status(500).json({ message: "Error creating contract" });
    }
  });
  
  app.patch("/api/contracts/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contract = await storage.getContract(id);
      
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      
      const updatedContract = await storage.updateContract(id, req.body);
      res.json(updatedContract);
    } catch (error) {
      res.status(500).json({ message: "Error updating contract" });
    }
  });
  
  app.patch("/api/contracts/:id/version", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contract = await storage.getContract(id);
      
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      
      const updatedContract = await storage.incrementContractVersion(id);
      res.json(updatedContract);
    } catch (error) {
      res.status(500).json({ message: "Error updating contract version" });
    }
  });
  
  app.patch("/api/contracts/:id/active", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { active } = req.body;
      
      if (active === undefined) {
        return res.status(400).json({ message: "Missing active status" });
      }
      
      const contract = await storage.getContract(id);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      
      const updatedContract = await storage.setContractActive(id, active);
      res.json(updatedContract);
    } catch (error) {
      res.status(500).json({ message: "Error updating contract active status" });
    }
  });
  
  app.delete("/api/contracts/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contract = await storage.getContract(id);
      
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      
      await storage.deleteContract(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting contract" });
    }
  });
  
  // Contract Signatures API
  app.get("/api/contract-signatures", isAuthenticated, async (req, res) => {
    try {
      const { contractId, email } = req.query;
      
      if (contractId) {
        const signatures = await storage.getContractSignaturesByContract(parseInt(contractId as string));
        return res.json(signatures);
      }
      
      if (email) {
        const signatures = await storage.getContractSignaturesByEmail(email as string);
        return res.json(signatures);
      }
      
      const signatures = await storage.getAllContractSignatures();
      res.json(signatures);
    } catch (error) {
      res.status(500).json({ message: "Error fetching contract signatures" });
    }
  });
  
  app.get("/api/contract-signatures/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const signature = await storage.getContractSignature(id);
      
      if (!signature) {
        return res.status(404).json({ message: "Contract signature not found" });
      }
      
      res.json(signature);
    } catch (error) {
      res.status(500).json({ message: "Error fetching contract signature" });
    }
  });
  
  app.post("/api/contract-signatures", async (req, res) => {
    try {
      const { 
        contractId, 
        customerName, 
        customerEmail, 
        signatureData, 
        ipAddress, 
        agreedToTerms,
        relatedEntityType,
        relatedEntityId 
      } = req.body;
      
      if (!contractId || !customerName || !customerEmail || !signatureData || agreedToTerms === undefined) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Check if contract exists
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      
      // Create the signature
      const newSignature = await storage.createContractSignature({
        contractId,
        customerName,
        customerEmail,
        signatureData,
        ipAddress,
        agreedToTerms,
        relatedEntityType,
        relatedEntityId
      });
      
      // If this is for a beat purchase, update the purchase to mark contract as signed
      if (relatedEntityType === 'beat' && relatedEntityId) {
        await storage.updateBeatPurchaseContract(relatedEntityId, true);
      }
      
      res.status(201).json(newSignature);
    } catch (error) {
      res.status(500).json({ message: "Error creating contract signature" });
    }
  });
  
  // Check if a user has signed a contract
  app.get("/api/verify-contract-signed", async (req, res) => {
    try {
      const { contractId, email } = req.query;
      
      if (!contractId || !email) {
        return res.status(400).json({ message: "Missing contractId or email" });
      }
      
      const isSigned = await storage.verifyContractSigned(
        parseInt(contractId as string), 
        email as string
      );
      
      res.json({ signed: isSigned });
    } catch (error) {
      res.status(500).json({ message: "Error verifying contract signature" });
    }
  });

  // Check if a user has signed a contract for a specific entity
  app.get("/api/verify-entity-contract-signed", async (req, res) => {
    try {
      const { entityType, entityId, email } = req.query;
      
      if (!entityType || !entityId || !email) {
        return res.status(400).json({ message: "Missing required parameters" });
      }
      
      const signature = await storage.getContractSignatureByEntityAndEmail(
        entityType as string,
        parseInt(entityId as string),
        email as string
      );
      
      res.json({ 
        signed: !!signature && signature.agreedToTerms,
        signature 
      });
    } catch (error) {
      res.status(500).json({ message: "Error verifying entity contract signature" });
    }
  });
  
  // Feedback and Ratings API
  
  // Get all feedbacks (admin only)
  app.get("/api/feedbacks", isAuthenticated, async (req, res) => {
    try {
      const feedbacks = await storage.getAllFeedbacks();
      res.json(feedbacks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get feedback stats
  app.get("/api/feedback-stats", async (req, res) => {
    try {
      const stats = await storage.getFeedbackStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get feedbacks by service type
  app.get("/api/feedbacks/service/:serviceType", async (req, res) => {
    try {
      const { serviceType } = req.params;
      const feedbacks = await storage.getFeedbacksByServiceType(serviceType);
      res.json(feedbacks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Submit new feedback
  app.post("/api/feedbacks", async (req, res) => {
    try {
      const feedback = await storage.createFeedback(req.body);
      res.status(201).json(feedback);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Update feedback status (admin only)
  app.put("/api/feedbacks/:id/status", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const feedback = await storage.updateFeedbackStatus(parseInt(id), status);
      if (!feedback) {
        return res.status(404).json({ error: "Feedback not found" });
      }
      res.json(feedback);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Delete feedback (admin only)
  app.delete("/api/feedbacks/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteFeedback(parseInt(id));
      if (!success) {
        return res.status(404).json({ error: "Feedback not found" });
      }
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Schedule Management API
  
  // Create weekly schedule (admin only)
  app.post("/api/schedule/weekly", isAuthenticated, async (req, res) => {
    try {
      const { 
        startDate, 
        endDate, 
        dailyStartTime, 
        dailyEndTime, 
        slotDuration, 
        daysOfWeek 
      } = req.body;
      
      const slots = await storage.createWeeklySchedule(
        new Date(startDate),
        new Date(endDate),
        dailyStartTime,
        dailyEndTime,
        slotDuration,
        daysOfWeek
      );
      
      res.status(201).json(slots);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Delete time slots in a date range (admin only)
  app.delete("/api/schedule/range", isAuthenticated, async (req, res) => {
    try {
      const { startDate, endDate } = req.body;
      
      const success = await storage.deleteTimeSlotsByDateRange(
        new Date(startDate),
        new Date(endDate)
      );
      
      if (success) {
        res.status(200).json({ message: "Time slots deleted successfully" });
      } else {
        res.status(404).json({ message: "No available time slots found in specified range" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Feedback Management API
  
  // Get all feedbacks
  app.get("/api/feedbacks", async (req, res) => {
    try {
      const feedbacks = await storage.getAllFeedbacks();
      res.json(feedbacks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get feedback by ID
  app.get("/api/feedbacks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const feedback = await storage.getFeedback(id);
      
      if (!feedback) {
        return res.status(404).json({ message: "Feedback not found" });
      }
      
      res.json(feedback);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get feedback by service type
  app.get("/api/feedbacks/service/:serviceType", async (req, res) => {
    try {
      const { serviceType } = req.params;
      const feedbacks = await storage.getFeedbacksByServiceType(serviceType);
      res.json(feedbacks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get feedback stats (average rating, total count, etc.)
  app.get("/api/feedback-stats", async (req, res) => {
    try {
      const stats = await storage.getFeedbackStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Create new feedback
  app.post("/api/feedbacks", async (req, res) => {
    try {
      const { name, email, rating, comment, serviceType, bookingId, beatPurchaseId } = req.body;
      
      // Validate required fields
      if (!rating || !serviceType) {
        return res.status(400).json({ message: "Rating and service type are required" });
      }
      
      const newFeedback = await storage.createFeedback({
        rating,
        serviceType,
        status: 'active',
        comment: comment || null,
        bookingId: bookingId || null,
        beatPurchaseId: beatPurchaseId || null,
        userId: null, // Can be linked to a user if authenticated
        name,
        email
      });
      
      res.status(201).json(newFeedback);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Update feedback status (active/hidden/flagged) - admin only
  app.put("/api/feedbacks/:id/status", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !['active', 'hidden', 'flagged'].includes(status)) {
        return res.status(400).json({ message: "Valid status is required (active, hidden, or flagged)" });
      }
      
      const feedback = await storage.getFeedback(id);
      if (!feedback) {
        return res.status(404).json({ message: "Feedback not found" });
      }
      
      const updatedFeedback = await storage.updateFeedbackStatus(id, status);
      res.json(updatedFeedback);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Delete feedback - admin only
  app.delete("/api/feedbacks/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const feedback = await storage.getFeedback(id);
      
      if (!feedback) {
        return res.status(404).json({ message: "Feedback not found" });
      }
      
      await storage.deleteFeedback(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // User loyalty program endpoints
  app.get("/api/user/loyalty", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const loyaltyRecords = await storage.getLoyaltyRecords(userId);
      const user = await storage.getUser(userId);
      
      res.json({
        points: user?.loyaltyPoints || 0,
        sessionCount: user?.sessionCount || 0,
        records: loyaltyRecords
      });
    } catch (error) {
      console.error("Error fetching loyalty info:", error);
      res.status(500).json({ error: "Failed to fetch loyalty information" });
    }
  });

  // Admin loyalty program management
  app.post("/api/admin/loyalty/rewards", isAuthenticated, async (req, res) => {
    if (req.user!.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }
    
    try {
      const { userId, points, reason, bookingId } = req.body;
      
      if (!userId || !points) {
        return res.status(400).json({ error: "User ID and points are required" });
      }
      
      // Update user's loyalty points
      await storage.updateUserLoyaltyPoints(userId, points);
      
      // Create loyalty record
      const record = await storage.createLoyaltyRecord({
        userId,
        action: points >= 0 ? "reward_earned" : "reward_used",
        pointsChange: points,
        description: reason || "Admin manual adjustment",
        bookingId: bookingId || undefined
      });
      
      res.json({ message: "Loyalty points added successfully", record });
    } catch (error) {
      console.error("Error adding loyalty points:", error);
      res.status(500).json({ error: "Failed to add loyalty points" });
    }
  });

  // Reward loyalty points when a booking is completed
  app.post("/api/bookings/:id/complete", isAuthenticated, async (req, res) => {
    if (req.user!.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }
    
    try {
      const bookingId = parseInt(req.params.id);
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      // Update booking status to completed
      await storage.updateBooking(bookingId, { status: "completed" });
      
      // If the booking has a user ID, add loyalty points and increment session count
      if (booking.userId) {
        // Calculate points based on booking amount (1 point per $10 spent)
        const pointsEarned = Math.floor(booking.amount / 10);
        
        // Update user's loyalty points
        await storage.updateUserLoyaltyPoints(booking.userId, pointsEarned);
        
        // Increment session count
        await storage.incrementUserSessionCount(booking.userId);
        
        // Record loyalty transaction
        await storage.createLoyaltyRecord({
          userId: booking.userId,
          action: "session_completed",
          pointsChange: pointsEarned,
          description: `Completed booking #${bookingId}`,
          bookingId
        });
        
        // Check if user has reached 5 sessions for free reward
        const user = await storage.getUser(booking.userId);
        if (user && user.sessionCount % 5 === 0) {
          // Create a loyalty record for the free session reward
          await storage.createLoyaltyRecord({
            userId: booking.userId,
            action: "reward_earned",
            pointsChange: 0, // No points but tracking the reward
            description: `Free 3-hour session reward (every 5 sessions)`,
            bookingId: undefined
          });
          
          return res.json({ 
            message: "Booking completed and loyalty reward earned!", 
            pointsEarned,
            rewardEarned: true,
            sessionCount: user.sessionCount
          });
        }
        
        return res.json({ 
          message: "Booking completed and loyalty points added!", 
          pointsEarned,
          sessionCount: user ? user.sessionCount : null
        });
      }
      
      res.json({ message: "Booking completed" });
    } catch (error) {
      console.error("Error completing booking:", error);
      res.status(500).json({ error: "Failed to complete booking" });
    }
  });

  // Promotions endpoints
  app.get("/api/promotions/active", async (req, res) => {
    try {
      const promotions = await storage.getActivePromotions();
      res.json(promotions);
    } catch (error) {
      console.error("Error fetching active promotions:", error);
      res.status(500).json({ error: "Failed to fetch active promotions" });
    }
  });

  app.post("/api/promotions/verify", async (req, res) => {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: "Promotion code is required" });
    }
    
    try {
      const promotion = await storage.getPromotionByCode(code);
      
      if (!promotion) {
        return res.status(404).json({ error: "Invalid promotion code" });
      }
      
      if (!promotion.active) {
        return res.status(400).json({ error: "This promotion is no longer active" });
      }
      
      const now = new Date();
      if (promotion.startDate > now || promotion.endDate < now) {
        return res.status(400).json({ error: "This promotion is not valid at this time" });
      }
      
      if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
        return res.status(400).json({ error: "This promotion has reached its usage limit" });
      }
      
      res.json({
        valid: true,
        promotion: {
          id: promotion.id,
          code: promotion.code,
          title: promotion.title,
          description: promotion.description,
          discountType: promotion.discountType,
          discountValue: promotion.discountValue,
          minPurchase: promotion.minPurchase,
          maxDiscount: promotion.maxDiscount
        }
      });
    } catch (error) {
      console.error("Error verifying promotion:", error);
      res.status(500).json({ error: "Failed to verify promotion code" });
    }
  });

  // Admin promotions management
  app.get("/api/admin/promotions", isAuthenticated, async (req, res) => {
    if (req.user!.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }
    
    try {
      const promotions = await storage.getAllPromotions();
      res.json(promotions);
    } catch (error) {
      console.error("Error fetching promotions:", error);
      res.status(500).json({ error: "Failed to fetch promotions" });
    }
  });

  app.get("/api/membership/plans", async (req, res) => {
    try {
      const plans = await storage.getAllMembershipPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching membership plans:", error);
      res.status(500).json({ error: "Failed to fetch membership plans" });
    }
  });

  app.get("/api/membership/plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const plan = await storage.getMembershipPlan(id);
      if (!plan) {
        return res.status(404).json({ message: "Membership plan not found" });
      }
      res.json(plan);
    } catch (error) {
      console.error("Error fetching membership plan:", error);
      res.status(500).json({ error: "Failed to fetch membership plan" });
    }
  });

  app.get("/api/user/membership", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      res.json(await getMembershipAccountPayload(userId));
    } catch (error) {
      console.error("Error fetching user membership:", error);
      res.status(500).json({ error: "Failed to fetch user membership" });
    }
  });

  app.post("/api/user/membership/subscribe", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { planId, prepaidTermMonths } = req.body;

      if (!planId) {
        return res.status(400).json({ error: "Membership plan ID is required" });
      }

      const plan = await storage.getMembershipPlan(parseInt(planId, 10));
      if (!plan) {
        return res.status(404).json({ error: "Membership plan not found" });
      }

      const existingMembership = await storage.getUserMembership(userId);
      if (existingMembership && ["active", "cancel_pending", "paused", "past_due", "pending_payment"].includes(existingMembership.status)) {
        return res.status(400).json({ error: "You already have a membership record in progress." });
      }

      const catalog = getMembershipCatalogByTier(plan.tier);
      const now = new Date();
      const currentPeriodStart = new Date(now);
      const termMonths = prepaidTermMonths === 3 ? 3 : 1;
      const currentPeriodEnd = addMonths(now, termMonths);
      const planVersion = await storage.getActiveMembershipPlanVersion(plan.id);

      const subscription = await storage.createMembershipSubscription({
        userId,
        planId: plan.id,
        planVersionId: planVersion?.id ?? null,
        status: "pending_payment",
        startDate: now,
        currentPeriodStart,
        currentPeriodEnd,
        nextBillingDate: new Date(currentPeriodEnd),
        paidThroughDate: new Date(currentPeriodEnd),
        cancellationRequestedAt: null,
        cancellationEffectiveAt: null,
        pauseStatus: "none",
        pauseStartDate: null,
        pauseEndDate: null,
        paymentProviderSubscriptionId: null,
        prepaidTermMonths: termMonths === 3 ? 3 : null,
      });

      await storage.createMembershipBillingPeriod({
        subscriptionId: subscription.id,
        periodStart: currentPeriodStart,
        periodEnd: currentPeriodEnd,
        amountCents: termMonths === 3 && catalog ? catalog.prepaidThreeMonthPriceCents : plan.priceCents,
        paymentStatus: "pending",
        status: "open",
      });

      await storage.createMembershipEvent({
        subscriptionId: subscription.id,
        eventType: "enrollment_started",
        details: JSON.stringify({
          note: "Payment provider integration is not enabled in this build. Admin payment verification is required before activation.",
          prepaidTermMonths: termMonths === 3 ? 3 : null,
        }),
      });

      res.status(201).json(await getMembershipAccountPayload(userId));
    } catch (error) {
      console.error("Error subscribing to membership:", error);
      res.status(500).json({ error: "Failed to subscribe to membership" });
    }
  });

  app.post("/api/user/membership/cancel", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const subscription = await storage.getUserMembership(userId);

      if (!subscription) {
        return res.status(404).json({ error: "No active membership found" });
      }

      const cancelled = await storage.cancelMembershipSubscription(subscription.id, subscription.currentPeriodEnd);
      if (cancelled) {
        await storage.createMembershipEvent({
          subscriptionId: cancelled.id,
          eventType: "cancellation_requested",
          details: JSON.stringify({
            cancellationEffectiveAt: cancelled.cancellationEffectiveAt,
            paidThroughDate: cancelled.paidThroughDate,
            language: MEMBERSHIP_CANCELLATION_LANGUAGE,
          }),
        });
      }

      res.json(await getMembershipAccountPayload(userId));
    } catch (error) {
      console.error("Error cancelling membership:", error);
      res.status(500).json({ error: "Failed to cancel membership" });
    }
  });

  app.post("/api/user/membership/pause", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { startDate, endDate, reason } = req.body;

      const subscription = await storage.getUserMembership(userId);
      if (!subscription) {
        return res.status(404).json({ error: "No active membership found" });
      }

      const pauses = await storage.getMembershipPauses(subscription.id);
      const sixMonthsAgo = addMonths(new Date(), -6);
      const recentPauses = pauses.filter((pause) => pause.createdAt >= sixMonthsAgo);
      if (recentPauses.length >= MEMBERSHIP_LAUNCH_RULES.pauseLimitPerSixMonths) {
        return res.status(400).json({ error: "Pause limit reached for the current six-month period." });
      }

      const pauseStart = startDate ? new Date(startDate) : new Date(subscription.nextBillingDate);
      const pauseEnd = endDate ? new Date(endDate) : addMonths(pauseStart, MEMBERSHIP_LAUNCH_RULES.pauseLengthCycles);
      const paused = await storage.pauseMembershipSubscription(
        subscription.id,
        pauseStart,
        pauseEnd
      );

      if (paused) {
        await storage.createMembershipPause({
          subscriptionId: paused.id,
          startDate: pauseStart,
          endDate: pauseEnd,
          status: "approved",
          reason: reason || null,
        });
        await storage.createMembershipEvent({
          subscriptionId: paused.id,
          eventType: "pause_scheduled",
          details: JSON.stringify({
            startDate: pauseStart,
            endDate: pauseEnd,
            reason: reason || null,
            note: "No new benefits are issued during the paused cycle.",
          }),
        });
      }

      res.json(await getMembershipAccountPayload(userId));
    } catch (error) {
      console.error("Error pausing membership:", error);
      res.status(500).json({ error: "Failed to pause membership" });
    }
  });

  app.post("/api/user/membership/resume", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const subscriptions = await storage.getMembershipSubscriptionsByUser(userId);
      const pausedSubscription = subscriptions.find((sub) => sub.status === "paused");

      if (!pausedSubscription) {
        return res.status(404).json({ error: "No paused membership found" });
      }

      const resumed = await storage.resumeMembershipSubscription(pausedSubscription.id);
      if (resumed) {
        await storage.createMembershipEvent({
          subscriptionId: resumed.id,
          eventType: "membership_resumed",
          details: JSON.stringify({ note: "Paused rollover hours may resume according to launch rules." }),
        });
      }
      res.json(await getMembershipAccountPayload(userId));
    } catch (error) {
      console.error("Error resuming membership:", error);
      res.status(500).json({ error: "Failed to resume membership" });
    }
  });

  app.post("/api/user/membership/reactivate", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { planId } = req.body;
      const selectedPlanId = planId ? parseInt(planId, 10) : null;
      const existingMembership = await storage.getUserMembership(userId);

      if (existingMembership && ["active", "cancel_pending", "paused", "past_due", "pending_payment"].includes(existingMembership.status)) {
        return res.status(400).json({ error: "Current membership must end before reactivation creates a new cycle." });
      }

      const plan = selectedPlanId ? await storage.getMembershipPlan(selectedPlanId) : null;
      if (!plan) {
        return res.status(400).json({ error: "Plan ID is required for reactivation." });
      }

      const now = new Date();
      const periodEnd = addMonths(now, 1);
      const planVersion = await storage.getActiveMembershipPlanVersion(plan.id);
      const subscription = await storage.createMembershipSubscription({
        userId,
        planId: plan.id,
        planVersionId: planVersion?.id ?? null,
        status: "pending_payment",
        startDate: now,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        nextBillingDate: periodEnd,
        paidThroughDate: periodEnd,
        cancellationRequestedAt: null,
        cancellationEffectiveAt: null,
        pauseStatus: "none",
        pauseStartDate: null,
        pauseEndDate: null,
        paymentProviderSubscriptionId: null,
        prepaidTermMonths: null,
      });

      await storage.createMembershipEvent({
        subscriptionId: subscription.id,
        eventType: "reactivation_started",
        details: JSON.stringify({ note: "Payment verification is required before benefits are issued." }),
      });

      res.status(201).json(await getMembershipAccountPayload(userId));
    } catch (error) {
      console.error("Error reactivating membership:", error);
      res.status(500).json({ error: "Failed to reactivate membership" });
    }
  });

  app.get("/api/admin/memberships", isAuthenticated, async (req, res) => {
    if (req.user!.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    try {
      const subscriptions = await storage.getAllMembershipSubscriptions();
      const enriched = await Promise.all(subscriptions.map(async (subscription) => {
        const user = await storage.getUser(subscription.userId);
        const plan = await storage.getMembershipPlan(subscription.planId);
        const ledger = await storage.getMembershipBenefitLedger(subscription.id);
        const events = await storage.getMembershipEvents(subscription.id);

        return {
          subscription,
          user: user ? { id: user.id, username: user.username, email: user.email, firstName: user.firstName, lastName: user.lastName } : null,
          plan,
          ledger,
          events,
        };
      }));

      res.json(enriched);
    } catch (error) {
      console.error("Error fetching admin memberships:", error);
      res.status(500).json({ error: "Failed to fetch memberships" });
    }
  });

  app.post("/api/admin/memberships/:id/activate", isAuthenticated, async (req, res) => {
    if (req.user!.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    try {
      const id = parseInt(req.params.id, 10);
      const subscription = (await storage.getAllMembershipSubscriptions()).find((item) => item.id === id);
      if (!subscription) {
        return res.status(404).json({ error: "Membership subscription not found" });
      }

      const updated = await storage.updateMembershipSubscription(id, {
        status: "active",
        updatedAt: new Date(),
      } as any);

      if (updated) {
        await issueMembershipBenefits(updated.id, updated.planId, "membership_subscription", updated.id, "Initial benefits issued after admin payment verification.");
        await storage.createMembershipEvent({
          subscriptionId: updated.id,
          eventType: "membership_activated",
          details: JSON.stringify({ note: "Activated by admin after external payment verification." }),
        });
      }

      res.json({ subscription: updated });
    } catch (error) {
      console.error("Error activating membership:", error);
      res.status(500).json({ error: "Failed to activate membership" });
    }
  });

  app.post("/api/admin/memberships/:id/adjust-benefit", isAuthenticated, async (req, res) => {
    if (req.user!.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    try {
      const subscriptionId = parseInt(req.params.id, 10);
      const { benefitDefinitionId, quantity, reason } = req.body;

      if (!benefitDefinitionId || !quantity || !reason) {
        return res.status(400).json({ error: "Benefit definition, quantity, and reason are required." });
      }

      const ledger = await storage.getMembershipBenefitLedger(subscriptionId);
      const entries = ledger
        .filter((entry) => entry.benefitDefinitionId === Number(benefitDefinitionId))
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      const before = entries[entries.length - 1]?.balanceAfter ?? 0;
      const after = before + Number(quantity);
      const entry = await storage.createMembershipBenefitLedger({
        subscriptionId,
        benefitDefinitionId: Number(benefitDefinitionId),
        action: "manual_adjustment",
        quantity: Number(quantity),
        balanceBefore: before,
        balanceAfter: after,
        referenceType: "admin_adjustment",
        referenceId: req.user!.id,
        notes: reason,
      });

      await storage.createMembershipEvent({
        subscriptionId,
        eventType: "benefit_adjusted",
        details: JSON.stringify({ benefitDefinitionId, quantity, reason, adminUserId: req.user!.id }),
      });

      res.status(201).json(entry);
    } catch (error) {
      console.error("Error adjusting membership benefit:", error);
      res.status(500).json({ error: "Failed to adjust benefit" });
    }
  });

  app.post("/api/admin/promotions", isAuthenticated, async (req, res) => {
    if (req.user!.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }
    
    try {
      const promotion = await storage.createPromotion(req.body);
      
      res.status(201).json(promotion);
    } catch (error) {
      console.error("Error creating promotion:", error);
      res.status(500).json({ error: "Failed to create promotion" });
    }
  });

  app.patch("/api/admin/promotions/:id", isAuthenticated, async (req, res) => {
    if (req.user!.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const { id } = req.params;
    
    try {
      const promotion = await storage.updatePromotion(parseInt(id), req.body);
      
      if (!promotion) {
        return res.status(404).json({ error: "Promotion not found" });
      }
      
      res.json(promotion);
    } catch (error) {
      console.error("Error updating promotion:", error);
      res.status(500).json({ error: "Failed to update promotion" });
    }
  });

  app.delete("/api/admin/promotions/:id", isAuthenticated, async (req, res) => {
    if (req.user!.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const { id } = req.params;
    
    try {
      const promotion = await storage.deactivatePromotion(parseInt(id));
      
      if (!promotion) {
        return res.status(404).json({ error: "Promotion not found" });
      }
      
      res.json({ message: "Promotion deactivated successfully" });
    } catch (error) {
      console.error("Error deactivating promotion:", error);
      res.status(500).json({ error: "Failed to deactivate promotion" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
