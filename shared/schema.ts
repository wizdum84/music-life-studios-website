import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema (admin users and customers)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("customer").notNull(), // customer, admin
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  sessionCount: integer("session_count").default(0).notNull(),
  loyaltyPoints: integer("loyalty_points").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
});

export const insertUserSchema = createInsertSchema(users)
  .omit({ 
    id: true, 
    sessionCount: true, 
    loyaltyPoints: true, 
    createdAt: true, 
    lastLogin: true 
  })
  .extend({
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    role: z.enum(["customer", "admin"]).default("customer"),
  });

// Services schema
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // In cents
  duration: integer("duration").notNull(), // In minutes
  features: text("features").array().notNull(),
});

export const insertServiceSchema = createInsertSchema(services).pick({
  name: true,
  description: true,
  price: true,
  duration: true,
  features: true,
});

// Portfolio tracks schema
export const tracks = pgTable("tracks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  audioUrl: text("audio_url").notNull(),
  imageUrl: text("image_url"),
  type: text("type").notNull(), // recording, mixing, production, sample
  category: text("category"), // For samples: general, vocals, drums, etc.
  sampleType: text("sample_type"), // For samples: mp3, wav, stem
});

export const insertTrackSchema = createInsertSchema(tracks).pick({
  title: true,
  description: true,
  audioUrl: true,
  imageUrl: true,
  type: true,
  category: true,
  sampleType: true,
});

// Bookings schema
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"), // Link to user if they're registered
  serviceId: integer("service_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  date: timestamp("date").notNull(),
  duration: integer("duration").notNull(), // In minutes
  details: text("details"),
  status: text("status").notNull().default("pending"), // pending, confirmed, completed, cancelled
  paymentIntentId: text("payment_intent_id"),
  paymentStatus: text("payment_status").default("unpaid").notNull(), // unpaid, deposit_paid, paid
  amount: integer("amount").notNull(), // In cents
  tipAmount: integer("tip_amount").default(0), // Optional tip amount in cents
  transactionId: text("transaction_id"),  // Stripe PaymentIntent ID
  paymentMethod: text("payment_method"),  // card, paypal, etc.
  paymentErrorMessage: text("payment_error_message"), // Error message if payment failed
  paymentMetadata: json("payment_metadata"), // Additional payment information
  discountCode: text("discount_code"), // Discount code applied to booking
  discountAmount: integer("discount_amount"), // Discount amount in cents
  loyaltyApplied: boolean("loyalty_applied").default(false), // Whether this is a free loyalty session
  retentionPolicy: text("retention_policy").default("guest").notNull(),
  retentionDays: integer("retention_days").default(30).notNull(),
  retentionDeadline: timestamp("retention_deadline"),
  retentionPolicyVersion: integer("retention_policy_version").default(1).notNull(),
  retentionTrigger: text("retention_trigger").default("project_completion").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBookingSchema = createInsertSchema(bookings)
  .omit({ 
    id: true, 
    createdAt: true, 
    paymentIntentId: true, 
    paymentStatus: true,
    transactionId: true,
    paymentMethod: true, 
    paymentErrorMessage: true,
    paymentMetadata: true,
    discountCode: true,
    discountAmount: true,
    loyaltyApplied: true,
    retentionPolicy: true,
    retentionDays: true,
    retentionDeadline: true,
    retentionPolicyVersion: true,
    retentionTrigger: true
  })
  .extend({
    userId: z.number().optional(),
    serviceId: z.number(),
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email"),
    phone: z.string().optional(),
    date: z.coerce.date(),
    duration: z.number(),
    details: z.string().optional(),
    amount: z.number(),
    discountCode: z.string().optional()
  });

// Contact messages schema
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMessageSchema = createInsertSchema(messages)
  .omit({ id: true, read: true, createdAt: true })
  .extend({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email"),
    subject: z.string().min(2, "Subject must be at least 2 characters"),
    message: z.string().min(10, "Message must be at least 10 characters")
  });

// Available time slots
export const timeSlots = pgTable("time_slots", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  available: boolean("available").default(true).notNull(),
  bookingId: integer("booking_id"),
});

export const insertTimeSlotSchema = createInsertSchema(timeSlots)
  .omit({ id: true })
  .extend({
    date: z.coerce.date(),
    available: z.boolean(),
    bookingId: z.number().nullable().optional(),
  });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

export type Track = typeof tracks.$inferSelect;
export type InsertTrack = z.infer<typeof insertTrackSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Beats schema for licensing
export const beats = pgTable("beats", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  genre: text("genre").notNull(),
  description: text("description").notNull(),
  previewUrl: text("preview_url").notNull(), // URL to preview audio
  fullAudioUrl: text("full_audio_url").notNull(), // URL to full audio (delivered after purchase)
  imageUrl: text("image_url"), // Cover image
  bpm: integer("bpm").notNull(), // Beats per minute
  price: integer("price").notNull(), // Price in cents
  licensingOptions: json("licensing_options").notNull(), // Different licensing options (basic, premium, exclusive)
  contractUrl: text("contract_url"), // URL to licensing contract PDF
  tags: text("tags").array(), // Keywords for search
  featured: boolean("featured").default(false), // Whether the beat is featured
  availabilityStatus: text("availability_status").default("available_nonexclusive").notNull(),
  availabilityUpdatedAt: timestamp("availability_updated_at"),
  starterRewardEligible: boolean("starter_reward_eligible").default(true).notNull(),
  commercialLeaseEligible: boolean("commercial_lease_eligible").default(true).notNull(),
  contentIdRestricted: boolean("content_id_restricted").default(true).notNull(),
  licenseVersion: integer("license_version").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBeatSchema = createInsertSchema(beats)
  .omit({ id: true, createdAt: true })
  .extend({
    title: z.string().min(2, "Title must be at least 2 characters"),
    genre: z.string(),
    description: z.string().min(10, "Description must be at least 10 characters"),
    previewUrl: z.string().url("Preview URL must be a valid URL"),
    fullAudioUrl: z.string().url("Full audio URL must be a valid URL"),
    imageUrl: z.string().url("Image URL must be a valid URL").optional(),
    bpm: z.number().min(1, "BPM must be at least 1"),
    price: z.number().min(1, "Price must be at least 1 cent"),
    licensingOptions: z.unknown(), // We'll validate this on the client side
    contractUrl: z.string().url("Contract URL must be a valid URL").optional(),
    tags: z.array(z.string()).optional(),
    featured: z.boolean().optional(),
    availabilityStatus: z.enum(["available_nonexclusive", "pending_exclusive", "exclusively_sold"]).optional(),
    availabilityUpdatedAt: z.coerce.date().nullable().optional(),
    starterRewardEligible: z.boolean().optional(),
    commercialLeaseEligible: z.boolean().optional(),
    contentIdRestricted: z.boolean().optional(),
    licenseVersion: z.number().int().positive().optional(),
  });

// Beat purchases
export const beatPurchases = pgTable("beat_purchases", {
  id: serial("id").primaryKey(),
  beatId: integer("beat_id").notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  licenseType: text("license_type").notNull(), // basic, premium, exclusive
  price: integer("price").notNull(), // Price in cents
  transactionId: text("transaction_id").notNull(), // Payment transaction ID
  downloadCount: integer("download_count").default(0), // Number of times downloaded
  contractSigned: boolean("contract_signed").default(false), // Whether the contract has been signed
  contractSignedAt: timestamp("contract_signed_at"), // When the contract was signed
  userId: integer("user_id"),
  licenseProduct: text("license_product").default("paid_nonexclusive").notNull(),
  licenseVersion: integer("license_version").default(1).notNull(),
  nonexclusive: boolean("nonexclusive").default(true).notNull(),
  licenseStartDate: timestamp("license_start_date"),
  rightsSnapshot: json("rights_snapshot"),
  contentIdAcknowledged: boolean("content_id_acknowledged").default(false).notNull(),
  rewardSourceType: text("reward_source_type"),
  rewardSourceId: integer("reward_source_id"),
  licenseStatus: text("license_status").default("pending").notNull(),
  signedSnapshotHash: text("signed_snapshot_hash"),
  purchaseDate: timestamp("purchase_date").defaultNow().notNull(),
});

export const insertBeatPurchaseSchema = createInsertSchema(beatPurchases)
  .omit({ id: true, downloadCount: true, contractSigned: true, contractSignedAt: true, userId: true, licenseProduct: true, licenseVersion: true, nonexclusive: true, licenseStartDate: true, rightsSnapshot: true, contentIdAcknowledged: true, rewardSourceType: true, rewardSourceId: true, licenseStatus: true, signedSnapshotHash: true, purchaseDate: true })
  .extend({
    beatId: z.number(),
    customerName: z.string().min(2, "Name must be at least 2 characters"),
    customerEmail: z.string().email("Please enter a valid email"),
    licenseType: z.string(),
    price: z.number().min(1, "Price must be at least 1 cent"),
    transactionId: z.string(),
  });

export type TimeSlot = typeof timeSlots.$inferSelect;
export type InsertTimeSlot = z.infer<typeof insertTimeSlotSchema>;

// Contracts schema
export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: text("content").default("").notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull().default("pdf"), // pdf, doc, docx
  category: text("category").notNull().default("licensing"), // licensing, services, other
  version: integer("version").default(1).notNull(), // Version tracking
  active: boolean("active").default(true).notNull(), // Whether this contract is currently active
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertContractSchema = createInsertSchema(contracts)
  .omit({ id: true, version: true, active: true, createdAt: true, updatedAt: true })
  .extend({
    title: z.string().min(2, "Title must be at least 2 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    content: z.string().optional().default(""),
    fileUrl: z.string().url("File URL must be a valid URL"),
    fileType: z.string().default("pdf"),
    category: z.string().default("licensing"),
  });

// Contract signatures
export const contractSignatures = pgTable("contract_signatures", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  signatureData: text("signature_data").notNull(), // Base64 signature image
  ipAddress: text("ip_address"), // IP address for verification
  agreedToTerms: boolean("agreed_to_terms").notNull().default(false),
  relatedEntityType: text("related_entity_type"), // "beat", "booking", etc.
  relatedEntityId: integer("related_entity_id"), // ID of the related entity
  contractVersion: integer("contract_version").default(1).notNull(),
  termsSnapshot: text("terms_snapshot"),
  signedDocumentHash: text("signed_document_hash"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertContractSignatureSchema = createInsertSchema(contractSignatures)
  .omit({ id: true, createdAt: true })
  .extend({
    contractId: z.number(),
    customerName: z.string().min(2, "Name must be at least 2 characters"),
    customerEmail: z.string().email("Please enter a valid email"),
    signatureData: z.string().min(10, "Signature data is required"),
    ipAddress: z.string().optional(),
    agreedToTerms: z.boolean(),
    relatedEntityType: z.string().optional(),
    relatedEntityId: z.number().optional(),
    contractVersion: z.number().int().positive().optional(),
    termsSnapshot: z.string().optional(),
    signedDocumentHash: z.string().optional(),
  });

export type Beat = typeof beats.$inferSelect;
export type InsertBeat = z.infer<typeof insertBeatSchema>;

export type BeatPurchase = typeof beatPurchases.$inferSelect;
export type InsertBeatPurchase = z.infer<typeof insertBeatPurchaseSchema>;

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = z.infer<typeof insertContractSchema>;

export type ContractSignature = typeof contractSignatures.$inferSelect;
export type InsertContractSignature = z.infer<typeof insertContractSignatureSchema>;

// Feedback and Ratings
export const feedbacks = pgTable("feedbacks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  bookingId: integer("booking_id"),
  beatPurchaseId: integer("beat_purchase_id"),
  name: text("name"),
  email: text("email"),
  rating: integer("rating").notNull(), // 1-5 star rating
  comment: text("comment"),
  serviceType: text("service_type").notNull(), // 'session', 'mixing', 'mastering', 'beat'
  status: text("status").default("active").notNull(), // 'active', 'hidden', 'flagged'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertFeedbackSchema = createInsertSchema(feedbacks)
  .omit({ id: true, createdAt: true, updatedAt: true });

export type Feedback = typeof feedbacks.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;

// Promotions schema
export const promotions = pgTable("promotions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  code: text("code").notNull().unique(),
  discountType: text("discount_type").notNull(), // percentage, fixed
  discountValue: integer("discount_value").notNull(), // Either percentage or amount in cents
  minPurchase: integer("min_purchase"), // Minimum purchase amount in cents
  maxDiscount: integer("max_discount"), // Maximum discount amount in cents
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  active: boolean("active").default(true).notNull(),
  usageLimit: integer("usage_limit"), // Maximum number of times the promo can be used
  usageCount: integer("usage_count").default(0).notNull(), // Number of times the promo has been used
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPromotionSchema = createInsertSchema(promotions)
  .omit({ id: true, usageCount: true, createdAt: true })
  .extend({
    title: z.string().min(2, "Title must be at least 2 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    code: z.string().min(3, "Code must be at least 3 characters"),
    discountType: z.enum(["percentage", "fixed"]),
    discountValue: z.number().min(1, "Discount value must be at least 1"),
    minPurchase: z.number().optional(),
    maxDiscount: z.number().optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    active: z.boolean().default(true),
    usageLimit: z.number().optional(),
  });

export type Promotion = typeof promotions.$inferSelect;
export type InsertPromotion = z.infer<typeof insertPromotionSchema>;

// Membership plans and subscription ledger schema
export const membershipPlans = pgTable("membership_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  tier: text("tier").notNull(),
  priceCents: integer("price_cents").notNull(),
  billingInterval: text("billing_interval").notNull().default("monthly"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const membershipPlanVersions = pgTable("membership_plan_versions", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull(),
  versionNumber: integer("version_number").default(1).notNull(),
  priceCents: integer("price_cents").notNull(),
  benefits: text("benefits").notNull(),
  active: boolean("active").default(true).notNull(),
  effectiveDate: timestamp("effective_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const membershipSubscriptions = pgTable("membership_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  planId: integer("plan_id").notNull(),
  planVersionId: integer("plan_version_id"),
  status: text("status").default("active").notNull(),
  startDate: timestamp("start_date").defaultNow().notNull(),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  nextBillingDate: timestamp("next_billing_date").notNull(),
  paidThroughDate: timestamp("paid_through_date").notNull(),
  cancellationRequestedAt: timestamp("cancellation_requested_at"),
  cancellationEffectiveAt: timestamp("cancellation_effective_at"),
  pauseStatus: text("pause_status").default("none").notNull(),
  pauseStartDate: timestamp("pause_start_date"),
  pauseEndDate: timestamp("pause_end_date"),
  paymentProviderSubscriptionId: text("payment_provider_subscription_id"),
  prepaidTermMonths: integer("prepaid_term_months"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const membershipBillingPeriods = pgTable("membership_billing_periods", {
  id: serial("id").primaryKey(),
  subscriptionId: integer("subscription_id").notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  amountCents: integer("amount_cents").notNull(),
  paymentStatus: text("payment_status").default("pending").notNull(),
  status: text("status").default("open").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const membershipBenefitDefinitions = pgTable("membership_benefit_definitions", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull(),
  code: text("code").notNull(),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  rolloverAllowed: boolean("rollover_allowed").default(false).notNull(),
  rolloverLimit: integer("rollover_limit").default(0).notNull(),
  expiresAfterCycles: integer("expires_after_cycles").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const membershipBenefitLedger = pgTable("membership_benefit_ledger", {
  id: serial("id").primaryKey(),
  subscriptionId: integer("subscription_id").notNull(),
  benefitDefinitionId: integer("benefit_definition_id").notNull(),
  action: text("action").notNull(),
  quantity: integer("quantity").notNull(),
  balanceBefore: integer("balance_before").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  referenceType: text("reference_type"),
  referenceId: integer("reference_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const membershipRedemptions = pgTable("membership_redemptions", {
  id: serial("id").primaryKey(),
  subscriptionId: integer("subscription_id").notNull(),
  benefitDefinitionId: integer("benefit_definition_id").notNull(),
  bookingId: integer("booking_id"),
  quantity: integer("quantity").notNull(),
  redeemedAt: timestamp("redeemed_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const membershipRollovers = pgTable("membership_rollovers", {
  id: serial("id").primaryKey(),
  subscriptionId: integer("subscription_id").notNull(),
  benefitDefinitionId: integer("benefit_definition_id").notNull(),
  rolledOverQuantity: integer("rolled_over_quantity").notNull(),
  fromBillingPeriodId: integer("from_billing_period_id").notNull(),
  toBillingPeriodId: integer("to_billing_period_id").notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const membershipDiscounts = pgTable("membership_discounts", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull(),
  discountType: text("discount_type").notNull(),
  discountValue: integer("discount_value").notNull(),
  eligibleServices: text("eligible_services").array().notNull(),
  stackable: boolean("stackable").default(false).notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const membershipEvents = pgTable("membership_events", {
  id: serial("id").primaryKey(),
  subscriptionId: integer("subscription_id").notNull(),
  eventType: text("event_type").notNull(),
  details: text("details").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const membershipPaymentAssociations = pgTable("membership_payment_associations", {
  id: serial("id").primaryKey(),
  subscriptionId: integer("subscription_id").notNull(),
  paymentProviderId: text("payment_provider_id").notNull(),
  amountCents: integer("amount_cents").notNull(),
  status: text("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const membershipPauses = pgTable("membership_pauses", {
  id: serial("id").primaryKey(),
  subscriptionId: integer("subscription_id").notNull(),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").default("pending").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const membershipLoyaltyMilestones = pgTable("membership_loyalty_milestones", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull(),
  name: text("name").notNull(),
  thresholdMonths: integer("threshold_months").notNull(),
  rewardType: text("reward_type").notNull(),
  rewardQuantity: integer("reward_quantity").notNull(),
  expiresAfterCycles: integer("expires_after_cycles").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const membershipLoyaltyRewards = pgTable("membership_loyalty_rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  milestoneId: integer("milestone_id").notNull(),
  subscriptionId: integer("subscription_id").notNull(),
  rewardType: text("reward_type").notNull(),
  rewardQuantity: integer("reward_quantity").notNull(),
  cycleNumber: integer("cycle_number").notNull().default(1),
  thresholdMonths: integer("threshold_months").notNull().default(1),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
  redemptionDeadline: timestamp("redemption_deadline"),
  sourcePaymentAssociationId: integer("source_payment_association_id"),
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  redeemedAt: timestamp("redeemed_at"),
  status: text("status").default("issued").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMembershipPlanSchema = createInsertSchema(membershipPlans)
  .omit({ id: true, createdAt: true, updatedAt: true });
export const insertMembershipPlanVersionSchema = createInsertSchema(membershipPlanVersions)
  .omit({ id: true, createdAt: true, updatedAt: true });
export const insertMembershipSubscriptionSchema = createInsertSchema(membershipSubscriptions)
  .omit({ id: true, createdAt: true, updatedAt: true });
export const insertMembershipBillingPeriodSchema = createInsertSchema(membershipBillingPeriods)
  .omit({ id: true, createdAt: true, updatedAt: true });
export const insertMembershipBenefitDefinitionSchema = createInsertSchema(membershipBenefitDefinitions)
  .omit({ id: true, createdAt: true, updatedAt: true });
export const insertMembershipBenefitLedgerSchema = createInsertSchema(membershipBenefitLedger)
  .omit({ id: true, createdAt: true });
export const insertMembershipRedemptionSchema = createInsertSchema(membershipRedemptions)
  .omit({ id: true, redeemedAt: true, createdAt: true });
export const insertMembershipRolloverSchema = createInsertSchema(membershipRollovers)
  .omit({ id: true, createdAt: true });
export const insertMembershipDiscountSchema = createInsertSchema(membershipDiscounts)
  .omit({ id: true, createdAt: true, updatedAt: true });
export const insertMembershipEventSchema = createInsertSchema(membershipEvents)
  .omit({ id: true, createdAt: true });
export const insertMembershipPaymentAssociationSchema = createInsertSchema(membershipPaymentAssociations)
  .omit({ id: true, createdAt: true });
export const insertMembershipPauseSchema = createInsertSchema(membershipPauses)
  .omit({ id: true, requestedAt: true, createdAt: true, updatedAt: true });
export const insertMembershipLoyaltyMilestoneSchema = createInsertSchema(membershipLoyaltyMilestones)
  .omit({ id: true, createdAt: true, updatedAt: true });
export const insertMembershipLoyaltyRewardSchema = createInsertSchema(membershipLoyaltyRewards)
  .omit({ id: true, earnedAt: true, issuedAt: true, createdAt: true });

export type MembershipPlan = typeof membershipPlans.$inferSelect;
export type InsertMembershipPlan = z.infer<typeof insertMembershipPlanSchema>;
export type MembershipPlanVersion = typeof membershipPlanVersions.$inferSelect;
export type InsertMembershipPlanVersion = z.infer<typeof insertMembershipPlanVersionSchema>;
export type MembershipSubscription = typeof membershipSubscriptions.$inferSelect;
export type InsertMembershipSubscription = z.infer<typeof insertMembershipSubscriptionSchema>;
export type MembershipBillingPeriod = typeof membershipBillingPeriods.$inferSelect;
export type InsertMembershipBillingPeriod = z.infer<typeof insertMembershipBillingPeriodSchema>;
export type MembershipBenefitDefinition = typeof membershipBenefitDefinitions.$inferSelect;
export type InsertMembershipBenefitDefinition = z.infer<typeof insertMembershipBenefitDefinitionSchema>;
export type MembershipBenefitLedger = typeof membershipBenefitLedger.$inferSelect;
export type InsertMembershipBenefitLedger = z.infer<typeof insertMembershipBenefitLedgerSchema>;
export type MembershipRedemption = typeof membershipRedemptions.$inferSelect;
export type InsertMembershipRedemption = z.infer<typeof insertMembershipRedemptionSchema>;
export type MembershipRollover = typeof membershipRollovers.$inferSelect;
export type InsertMembershipRollover = z.infer<typeof insertMembershipRolloverSchema>;
export type MembershipDiscount = typeof membershipDiscounts.$inferSelect;
export type InsertMembershipDiscount = z.infer<typeof insertMembershipDiscountSchema>;
export type MembershipEvent = typeof membershipEvents.$inferSelect;
export type InsertMembershipEvent = z.infer<typeof insertMembershipEventSchema>;
export type MembershipPaymentAssociation = typeof membershipPaymentAssociations.$inferSelect;
export type InsertMembershipPaymentAssociation = z.infer<typeof insertMembershipPaymentAssociationSchema>;
export type MembershipPause = typeof membershipPauses.$inferSelect;
export type InsertMembershipPause = z.infer<typeof insertMembershipPauseSchema>;
export type MembershipLoyaltyMilestone = typeof membershipLoyaltyMilestones.$inferSelect;
export type InsertMembershipLoyaltyMilestone = z.infer<typeof insertMembershipLoyaltyMilestoneSchema>;
export type MembershipLoyaltyReward = typeof membershipLoyaltyRewards.$inferSelect;
export type InsertMembershipLoyaltyReward = z.infer<typeof insertMembershipLoyaltyRewardSchema>;

// User loyalty records schema (for tracking loyalty program activity)
export const loyaltyRecords = pgTable("loyalty_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  bookingId: integer("booking_id"),
  action: text("action").notNull(), // stamp_earned, session_completed, reward_earned, reward_used, reversal
  pointsChange: integer("points_change").notNull(), // Positive for earned, negative for used
  description: text("description").notNull(),
  cycleNumber: integer("cycle_number"),
  rewardType: text("reward_type"),
  rewardQuantity: integer("reward_quantity"),
  earnedAt: timestamp("earned_at"),
  redemptionDeadline: timestamp("redemption_deadline"),
  status: text("status").default("valid").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLoyaltyRecordSchema = createInsertSchema(loyaltyRecords)
  .omit({ id: true, createdAt: true })
  .extend({
    userId: z.number(),
    bookingId: z.number().optional(),
    action: z.enum(["stamp_earned", "session_completed", "reward_earned", "reward_used", "reversal"]),
    pointsChange: z.number(),
    description: z.string().min(2, "Description must be at least 2 characters"),
    cycleNumber: z.number().int().positive().optional(),
    rewardType: z.string().optional(),
    rewardQuantity: z.number().optional(),
    earnedAt: z.coerce.date().optional(),
    redemptionDeadline: z.coerce.date().optional(),
    status: z.enum(["valid", "held", "redeemed", "expired", "reversed", "review"]).optional(),
    metadata: z.unknown().optional(),
  });

export type LoyaltyRecord = typeof loyaltyRecords.$inferSelect;
export type InsertLoyaltyRecord = z.infer<typeof insertLoyaltyRecordSchema>;
