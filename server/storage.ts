import { 
  User, InsertUser, 
  Service, InsertService, 
  Track, InsertTrack, 
  Booking, InsertBooking,
  Message, InsertMessage,
  TimeSlot, InsertTimeSlot,
  Beat, InsertBeat,
  BeatPurchase, InsertBeatPurchase,
  Contract, InsertContract,
  ContractSignature, InsertContractSignature,
  Feedback, InsertFeedback,
  Promotion, InsertPromotion,
  LoyaltyRecord, InsertLoyaltyRecord,
  users, services, tracks, bookings, messages, timeSlots,
  beats, beatPurchases, contracts, contractSignatures, feedbacks,
  promotions, loyaltyRecords
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, sql, asc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

// Initialize PostgreSQL session store
const PgSessionStore = connectPg(session);

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  updateUserLoginTime(id: number): Promise<User | undefined>;
  updateUserLoyaltyPoints(id: number, points: number): Promise<User | undefined>;
  incrementUserSessionCount(id: number): Promise<User | undefined>;
  getUserBookings(userId: number): Promise<Booking[]>;
  
  // Loyalty Program
  getLoyaltyRecords(userId: number): Promise<LoyaltyRecord[]>;
  createLoyaltyRecord(record: InsertLoyaltyRecord): Promise<LoyaltyRecord>;
  
  // Promotions
  getAllPromotions(): Promise<Promotion[]>;
  getActivePromotions(): Promise<Promotion[]>;
  getPromotion(id: number): Promise<Promotion | undefined>;
  getPromotionByCode(code: string): Promise<Promotion | undefined>;
  createPromotion(promotion: InsertPromotion): Promise<Promotion>;
  updatePromotion(id: number, promotion: Partial<InsertPromotion>): Promise<Promotion | undefined>;
  incrementPromotionUsage(id: number): Promise<Promotion | undefined>;
  deactivatePromotion(id: number): Promise<Promotion | undefined>;
  
  // Services
  getAllServices(): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: number): Promise<boolean>;
  
  // Tracks
  getAllTracks(): Promise<Track[]>;
  getTrack(id: number): Promise<Track | undefined>;
  createTrack(track: InsertTrack): Promise<Track>;
  updateTrack(id: number, track: Partial<InsertTrack>): Promise<Track | undefined>;
  deleteTrack(id: number): Promise<boolean>;
  
  // Bookings
  getAllBookings(): Promise<Booking[]>;
  getBooking(id: number): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: number, booking: Partial<InsertBooking>): Promise<Booking | undefined>;
  updateBookingPayment(id: number, paymentIntentId: string, status: string): Promise<Booking | undefined>;
  updateBookingTransactionInfo(id: number, transactionInfo: {
    transactionId: string;
    paymentStatus: string;
    paymentMethod?: string;
    paymentErrorMessage?: string;
    paymentMetadata?: any;
    tipAmount?: number;
  }): Promise<Booking | undefined>;
  deleteBooking(id: number): Promise<boolean>;
  
  // Messages
  getAllMessages(): Promise<Message[]>;
  getMessage(id: number): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message | undefined>;
  deleteMessage(id: number): Promise<boolean>;
  
  // Time Slots
  getAllTimeSlots(): Promise<TimeSlot[]>;
  getAvailableTimeSlots(startDate: Date, endDate: Date): Promise<TimeSlot[]>;
  createTimeSlot(timeSlot: InsertTimeSlot): Promise<TimeSlot>;
  bookTimeSlot(id: number, bookingId: number): Promise<TimeSlot | undefined>;
  releaseTimeSlot(id: number): Promise<TimeSlot | undefined>;
  // Bulk time slot creation for schedule management
  createWeeklySchedule(
    startDate: Date, 
    endDate: Date, 
    dailyStartTime: string, 
    dailyEndTime: string, 
    slotDuration: number, 
    daysOfWeek: number[]
  ): Promise<TimeSlot[]>;
  deleteTimeSlotsByDateRange(startDate: Date, endDate: Date): Promise<boolean>;
  
  // Beats
  getAllBeats(): Promise<Beat[]>;
  getFeaturedBeats(): Promise<Beat[]>;
  getBeatsByGenre(genre: string): Promise<Beat[]>;
  getBeat(id: number): Promise<Beat | undefined>;
  createBeat(beat: InsertBeat): Promise<Beat>;
  updateBeat(id: number, beat: Partial<InsertBeat>): Promise<Beat | undefined>;
  deleteBeat(id: number): Promise<boolean>;
  
  // Beat Purchases
  getAllBeatPurchases(): Promise<BeatPurchase[]>;
  getBeatPurchasesByBeat(beatId: number): Promise<BeatPurchase[]>;
  getBeatPurchasesByEmail(email: string): Promise<BeatPurchase[]>;
  getBeatPurchase(id: number): Promise<BeatPurchase | undefined>;
  createBeatPurchase(purchase: InsertBeatPurchase): Promise<BeatPurchase>;
  updateBeatPurchaseContract(id: number, contractSigned: boolean): Promise<BeatPurchase | undefined>;
  incrementBeatPurchaseDownloadCount(id: number): Promise<BeatPurchase | undefined>;
  
  // Contracts
  getAllContracts(): Promise<Contract[]>;
  getContractsByCategory(category: string): Promise<Contract[]>;
  getActiveContracts(): Promise<Contract[]>;
  getContract(id: number): Promise<Contract | undefined>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: number, contract: Partial<InsertContract>): Promise<Contract | undefined>;
  incrementContractVersion(id: number): Promise<Contract | undefined>;
  setContractActive(id: number, active: boolean): Promise<Contract | undefined>;
  deleteContract(id: number): Promise<boolean>;
  
  // Contract Signatures
  getAllContractSignatures(): Promise<ContractSignature[]>;
  getContractSignature(id: number): Promise<ContractSignature | undefined>;
  getContractSignaturesByContract(contractId: number): Promise<ContractSignature[]>;
  getContractSignaturesByEmail(email: string): Promise<ContractSignature[]>;
  getContractSignatureByEntityAndEmail(relatedEntityType: string, relatedEntityId: number, email: string): Promise<ContractSignature | undefined>;
  createContractSignature(signature: InsertContractSignature): Promise<ContractSignature>;
  verifyContractSigned(contractId: number, email: string): Promise<boolean>;
  
  // Feedback and Ratings
  getAllFeedbacks(): Promise<Feedback[]>;
  getFeedback(id: number): Promise<Feedback | undefined>;
  getFeedbacksByBooking(bookingId: number): Promise<Feedback[]>;
  getFeedbacksByBeatPurchase(beatPurchaseId: number): Promise<Feedback[]>;
  getFeedbacksByServiceType(serviceType: string): Promise<Feedback[]>;
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  updateFeedbackStatus(id: number, status: string): Promise<Feedback | undefined>;
  deleteFeedback(id: number): Promise<boolean>;
  getFeedbackStats(): Promise<{ 
    averageRating: number; 
    totalFeedbacks: number;
    ratingDistribution: Record<string, number>;
  }>;

  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PgSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users).set(userData).where(eq(users.id, id)).returning();
    return result[0];
  }

  async updateUserLoginTime(id: number): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async updateUserLoyaltyPoints(id: number, points: number): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const newPoints = user.loyaltyPoints + points;
    const result = await db.update(users)
      .set({ loyaltyPoints: newPoints })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async incrementUserSessionCount(id: number): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const newCount = (user.sessionCount || 0) + 1;
    const result = await db.update(users)
      .set({ sessionCount: newCount })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async getUserBookings(userId: number): Promise<Booking[]> {
    return db.select()
      .from(bookings)
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.createdAt));
  }

  // Services
  async getAllServices(): Promise<Service[]> {
    return db.select().from(services);
  }

  async getService(id: number): Promise<Service | undefined> {
    const result = await db.select().from(services).where(eq(services.id, id)).limit(1);
    return result[0];
  }

  async createService(service: InsertService): Promise<Service> {
    const result = await db.insert(services).values(service).returning();
    return result[0];
  }

  async updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined> {
    const result = await db.update(services).set(service).where(eq(services.id, id)).returning();
    return result[0];
  }

  async deleteService(id: number): Promise<boolean> {
    const result = await db.delete(services).where(eq(services.id, id));
    return true;
  }

  // Tracks
  async getAllTracks(): Promise<Track[]> {
    return db.select().from(tracks);
  }

  async getTrack(id: number): Promise<Track | undefined> {
    const result = await db.select().from(tracks).where(eq(tracks.id, id)).limit(1);
    return result[0];
  }

  async createTrack(track: InsertTrack): Promise<Track> {
    const result = await db.insert(tracks).values(track).returning();
    return result[0];
  }

  async updateTrack(id: number, track: Partial<InsertTrack>): Promise<Track | undefined> {
    const result = await db.update(tracks).set(track).where(eq(tracks.id, id)).returning();
    return result[0];
  }

  async deleteTrack(id: number): Promise<boolean> {
    await db.delete(tracks).where(eq(tracks.id, id));
    return true;
  }

  // Bookings
  async getAllBookings(): Promise<Booking[]> {
    return db.select().from(bookings).orderBy(desc(bookings.createdAt));
  }

  async getBooking(id: number): Promise<Booking | undefined> {
    const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    return result[0];
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const result = await db.insert(bookings).values(booking).returning();
    return result[0];
  }

  async updateBooking(id: number, booking: Partial<InsertBooking>): Promise<Booking | undefined> {
    const result = await db.update(bookings).set(booking).where(eq(bookings.id, id)).returning();
    return result[0];
  }

  async updateBookingPayment(id: number, paymentIntentId: string, status: string): Promise<Booking | undefined> {
    const result = await db.update(bookings)
      .set({ 
        transactionId: paymentIntentId,
        paymentStatus: status
      })
      .where(eq(bookings.id, id))
      .returning();
    return result[0];
  }

  async updateBookingTransactionInfo(id: number, transactionInfo: {
    transactionId: string;
    paymentStatus: string;
    paymentMethod?: string;
    paymentErrorMessage?: string;
    paymentMetadata?: any;
    tipAmount?: number;
  }): Promise<Booking | undefined> {
    const result = await db.update(bookings)
      .set({ 
        transactionId: transactionInfo.transactionId,
        paymentStatus: transactionInfo.paymentStatus,
        paymentMethod: transactionInfo.paymentMethod,
        paymentErrorMessage: transactionInfo.paymentErrorMessage,
        paymentMetadata: transactionInfo.paymentMetadata,
        tipAmount: transactionInfo.tipAmount || 0
      })
      .where(eq(bookings.id, id))
      .returning();
    return result[0];
  }

  async deleteBooking(id: number): Promise<boolean> {
    await db.delete(bookings).where(eq(bookings.id, id));
    return true;
  }

  // Messages
  async getAllMessages(): Promise<Message[]> {
    return db.select().from(messages).orderBy(desc(messages.createdAt));
  }

  async getMessage(id: number): Promise<Message | undefined> {
    const result = await db.select().from(messages).where(eq(messages.id, id)).limit(1);
    return result[0];
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values(message).returning();
    return result[0];
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const result = await db.update(messages)
      .set({ read: true })
      .where(eq(messages.id, id))
      .returning();
    return result[0];
  }

  async deleteMessage(id: number): Promise<boolean> {
    await db.delete(messages).where(eq(messages.id, id));
    return true;
  }

  // Time Slots
  async getAllTimeSlots(): Promise<TimeSlot[]> {
    return db.select().from(timeSlots).orderBy(asc(timeSlots.date));
  }

  async getAvailableTimeSlots(startDate: Date, endDate: Date): Promise<TimeSlot[]> {
    return db.select()
      .from(timeSlots)
      .where(
        and(
          gte(timeSlots.date, startDate),
          lte(timeSlots.date, endDate),
          eq(timeSlots.available, true)
        )
      )
      .orderBy(asc(timeSlots.date));
  }

  async createTimeSlot(timeSlot: InsertTimeSlot): Promise<TimeSlot> {
    const result = await db.insert(timeSlots).values(timeSlot).returning();
    return result[0];
  }

  async bookTimeSlot(id: number, bookingId: number): Promise<TimeSlot | undefined> {
    const result = await db.update(timeSlots)
      .set({ 
        available: false,
        bookingId: bookingId 
      })
      .where(eq(timeSlots.id, id))
      .returning();
    return result[0];
  }

  async releaseTimeSlot(id: number): Promise<TimeSlot | undefined> {
    const result = await db.update(timeSlots)
      .set({ 
        available: true,
        bookingId: null 
      })
      .where(eq(timeSlots.id, id))
      .returning();
    return result[0];
  }

  async createWeeklySchedule(
    startDate: Date, 
    endDate: Date, 
    dailyStartTime: string, 
    dailyEndTime: string, 
    slotDuration: number, 
    daysOfWeek: number[]
  ): Promise<TimeSlot[]> {
    // Implementation for creating weekly schedules
    // This is a more complex operation that would create multiple time slots
    // based on the provided parameters
    
    const slots: InsertTimeSlot[] = [];
    const [startHour, startMinute] = dailyStartTime.split(':').map(Number);
    const [endHour, endMinute] = dailyEndTime.split(':').map(Number);
    
    // Loop through each day in the date range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
      
      // Check if this day of the week is included
      if (daysOfWeek.includes(dayOfWeek)) {
        // Create slots for this day from start time to end time
        const slotDate = new Date(currentDate);
        slotDate.setHours(startHour, startMinute, 0, 0);
        
        const endSlotDate = new Date(currentDate);
        endSlotDate.setHours(endHour, endMinute, 0, 0);
        
        while (slotDate < endSlotDate) {
          slots.push({
            date: new Date(slotDate),
            available: true,
            bookingId: null
          });
          
          // Move to next slot time
          slotDate.setMinutes(slotDate.getMinutes() + slotDuration);
        }
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Bulk insert all slots
    if (slots.length > 0) {
      const result = await db.insert(timeSlots).values(slots).returning();
      return result;
    }
    
    return [];
  }

  async deleteTimeSlotsByDateRange(startDate: Date, endDate: Date): Promise<boolean> {
    await db.delete(timeSlots)
      .where(
        and(
          gte(timeSlots.date, startDate),
          lte(timeSlots.date, endDate)
        )
      );
    return true;
  }

  // Beats
  async getAllBeats(): Promise<Beat[]> {
    return db.select().from(beats).orderBy(desc(beats.createdAt));
  }

  async getFeaturedBeats(): Promise<Beat[]> {
    return db.select()
      .from(beats)
      .where(eq(beats.featured, true))
      .orderBy(desc(beats.createdAt));
  }

  async getBeatsByGenre(genre: string): Promise<Beat[]> {
    return db.select()
      .from(beats)
      .where(eq(beats.genre, genre))
      .orderBy(desc(beats.createdAt));
  }

  async getBeat(id: number): Promise<Beat | undefined> {
    const result = await db.select().from(beats).where(eq(beats.id, id)).limit(1);
    return result[0];
  }

  async createBeat(beat: InsertBeat): Promise<Beat> {
    const result = await db.insert(beats).values({
      ...beat,
      licensingOptions: beat.licensingOptions ?? {},
    }).returning();
    return result[0];
  }

  async updateBeat(id: number, beat: Partial<InsertBeat>): Promise<Beat | undefined> {
    const result = await db.update(beats).set(beat).where(eq(beats.id, id)).returning();
    return result[0];
  }

  async deleteBeat(id: number): Promise<boolean> {
    await db.delete(beats).where(eq(beats.id, id));
    return true;
  }

  // Beat Purchases
  async getAllBeatPurchases(): Promise<BeatPurchase[]> {
    return db.select().from(beatPurchases).orderBy(desc(beatPurchases.purchaseDate));
  }

  async getBeatPurchasesByBeat(beatId: number): Promise<BeatPurchase[]> {
    return db.select()
      .from(beatPurchases)
      .where(eq(beatPurchases.beatId, beatId))
      .orderBy(desc(beatPurchases.purchaseDate));
  }

  async getBeatPurchasesByEmail(email: string): Promise<BeatPurchase[]> {
    return db.select()
      .from(beatPurchases)
      .where(eq(beatPurchases.customerEmail, email))
      .orderBy(desc(beatPurchases.purchaseDate));
  }

  async getBeatPurchase(id: number): Promise<BeatPurchase | undefined> {
    const result = await db.select().from(beatPurchases).where(eq(beatPurchases.id, id)).limit(1);
    return result[0];
  }

  async createBeatPurchase(purchase: InsertBeatPurchase): Promise<BeatPurchase> {
    const result = await db.insert(beatPurchases).values(purchase).returning();
    return result[0];
  }

  async updateBeatPurchaseContract(id: number, contractSigned: boolean): Promise<BeatPurchase | undefined> {
    const result = await db.update(beatPurchases)
      .set({ contractSigned })
      .where(eq(beatPurchases.id, id))
      .returning();
    return result[0];
  }

  async incrementBeatPurchaseDownloadCount(id: number): Promise<BeatPurchase | undefined> {
    // Use SQL expression to increment the value
    const result = await db.update(beatPurchases)
      .set({ 
        downloadCount: sql`${beatPurchases.downloadCount} + 1` 
      })
      .where(eq(beatPurchases.id, id))
      .returning();
    return result[0];
  }

  // Contracts
  async getAllContracts(): Promise<Contract[]> {
    return db.select().from(contracts).orderBy(desc(contracts.createdAt));
  }

  async getContractsByCategory(category: string): Promise<Contract[]> {
    return db.select()
      .from(contracts)
      .where(eq(contracts.category, category))
      .orderBy(desc(contracts.createdAt));
  }

  async getActiveContracts(): Promise<Contract[]> {
    return db.select()
      .from(contracts)
      .where(eq(contracts.active, true))
      .orderBy(desc(contracts.createdAt));
  }

  async getContract(id: number): Promise<Contract | undefined> {
    const result = await db.select().from(contracts).where(eq(contracts.id, id)).limit(1);
    return result[0];
  }

  async createContract(contract: InsertContract): Promise<Contract> {
    const result = await db.insert(contracts).values(contract).returning();
    return result[0];
  }

  async updateContract(id: number, contract: Partial<InsertContract>): Promise<Contract | undefined> {
    const result = await db.update(contracts).set(contract).where(eq(contracts.id, id)).returning();
    return result[0];
  }

  async incrementContractVersion(id: number): Promise<Contract | undefined> {
    const result = await db.update(contracts)
      .set({ 
        version: sql`${contracts.version} + 1` 
      })
      .where(eq(contracts.id, id))
      .returning();
    return result[0];
  }

  async setContractActive(id: number, active: boolean): Promise<Contract | undefined> {
    const result = await db.update(contracts)
      .set({ active })
      .where(eq(contracts.id, id))
      .returning();
    return result[0];
  }

  async deleteContract(id: number): Promise<boolean> {
    await db.delete(contracts).where(eq(contracts.id, id));
    return true;
  }

  // Contract Signatures
  async getAllContractSignatures(): Promise<ContractSignature[]> {
    return db.select().from(contractSignatures).orderBy(desc(contractSignatures.createdAt));
  }

  async getContractSignature(id: number): Promise<ContractSignature | undefined> {
    const result = await db.select().from(contractSignatures).where(eq(contractSignatures.id, id)).limit(1);
    return result[0];
  }

  async getContractSignaturesByContract(contractId: number): Promise<ContractSignature[]> {
    return db.select()
      .from(contractSignatures)
      .where(eq(contractSignatures.contractId, contractId))
      .orderBy(desc(contractSignatures.createdAt));
  }

  async getContractSignaturesByEmail(email: string): Promise<ContractSignature[]> {
    return db.select()
      .from(contractSignatures)
      .where(eq(contractSignatures.customerEmail, email))
      .orderBy(desc(contractSignatures.createdAt));
  }

  async getContractSignatureByEntityAndEmail(
    relatedEntityType: string, 
    relatedEntityId: number, 
    email: string
  ): Promise<ContractSignature | undefined> {
    const result = await db.select()
      .from(contractSignatures)
      .where(
        and(
          eq(contractSignatures.relatedEntityType, relatedEntityType),
          eq(contractSignatures.relatedEntityId, relatedEntityId),
          eq(contractSignatures.customerEmail, email)
        )
      )
      .limit(1);
    return result[0];
  }

  async createContractSignature(signature: InsertContractSignature): Promise<ContractSignature> {
    const result = await db.insert(contractSignatures).values(signature).returning();
    return result[0];
  }

  async verifyContractSigned(contractId: number, email: string): Promise<boolean> {
    const result = await db.select()
      .from(contractSignatures)
      .where(
        and(
          eq(contractSignatures.contractId, contractId),
          eq(contractSignatures.customerEmail, email)
        )
      )
      .limit(1);
    return result.length > 0;
  }

  // Feedback and Ratings
  async getAllFeedbacks(): Promise<Feedback[]> {
    return db.select().from(feedbacks).orderBy(desc(feedbacks.createdAt));
  }

  async getFeedback(id: number): Promise<Feedback | undefined> {
    const result = await db.select().from(feedbacks).where(eq(feedbacks.id, id)).limit(1);
    return result[0];
  }

  async getFeedbacksByBooking(bookingId: number): Promise<Feedback[]> {
    return db.select()
      .from(feedbacks)
      .where(eq(feedbacks.bookingId, bookingId))
      .orderBy(desc(feedbacks.createdAt));
  }

  async getFeedbacksByBeatPurchase(beatPurchaseId: number): Promise<Feedback[]> {
    return db.select()
      .from(feedbacks)
      .where(eq(feedbacks.beatPurchaseId, beatPurchaseId))
      .orderBy(desc(feedbacks.createdAt));
  }

  async getFeedbacksByServiceType(serviceType: string): Promise<Feedback[]> {
    return db.select()
      .from(feedbacks)
      .where(eq(feedbacks.serviceType, serviceType))
      .orderBy(desc(feedbacks.createdAt));
  }

  async createFeedback(feedback: InsertFeedback): Promise<Feedback> {
    const result = await db.insert(feedbacks).values(feedback).returning();
    return result[0];
  }

  async updateFeedbackStatus(id: number, status: string): Promise<Feedback | undefined> {
    const result = await db.update(feedbacks)
      .set({ status })
      .where(eq(feedbacks.id, id))
      .returning();
    return result[0];
  }

  async deleteFeedback(id: number): Promise<boolean> {
    await db.delete(feedbacks).where(eq(feedbacks.id, id));
    return true;
  }

  async getFeedbackStats(): Promise<{ 
    averageRating: number; 
    totalFeedbacks: number;
    ratingDistribution: Record<string, number>;
  }> {
    const allFeedbacks = await db.select().from(feedbacks);
    
    if (allFeedbacks.length === 0) {
      return {
        averageRating: 0,
        totalFeedbacks: 0,
        ratingDistribution: {}
      };
    }
    
    const totalRating = allFeedbacks.reduce((sum, feedback) => sum + feedback.rating, 0);
    const averageRating = totalRating / allFeedbacks.length;
    
    // Count the number of each rating
    const ratingDistribution: Record<string, number> = {};
    for (const feedback of allFeedbacks) {
      const rating = feedback.rating.toString();
      ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
    }
    
    return {
      averageRating,
      totalFeedbacks: allFeedbacks.length,
      ratingDistribution
    };
  }

  // Loyalty Program
  async getLoyaltyRecords(userId: number): Promise<LoyaltyRecord[]> {
    return db.select()
      .from(loyaltyRecords)
      .where(eq(loyaltyRecords.userId, userId))
      .orderBy(desc(loyaltyRecords.createdAt));
  }

  async createLoyaltyRecord(record: InsertLoyaltyRecord): Promise<LoyaltyRecord> {
    const result = await db.insert(loyaltyRecords).values(record).returning();
    return result[0];
  }

  // Promotions
  async getAllPromotions(): Promise<Promotion[]> {
    return db.select().from(promotions).orderBy(desc(promotions.createdAt));
  }

  async getActivePromotions(): Promise<Promotion[]> {
    const now = new Date();
    return db.select()
      .from(promotions)
      .where(
        and(
          eq(promotions.active, true),
          lte(promotions.startDate, now),
          gte(promotions.endDate, now)
        )
      )
      .orderBy(desc(promotions.createdAt));
  }

  async getPromotion(id: number): Promise<Promotion | undefined> {
    const result = await db.select().from(promotions).where(eq(promotions.id, id)).limit(1);
    return result[0];
  }

  async getPromotionByCode(code: string): Promise<Promotion | undefined> {
    const result = await db.select().from(promotions).where(eq(promotions.code, code)).limit(1);
    return result[0];
  }

  async createPromotion(promotion: InsertPromotion): Promise<Promotion> {
    const result = await db.insert(promotions).values(promotion).returning();
    return result[0];
  }

  async updatePromotion(id: number, promotion: Partial<InsertPromotion>): Promise<Promotion | undefined> {
    const result = await db.update(promotions).set(promotion).where(eq(promotions.id, id)).returning();
    return result[0];
  }

  async incrementPromotionUsage(id: number): Promise<Promotion | undefined> {
    const result = await db.update(promotions)
      .set({ 
        usageCount: sql`${promotions.usageCount} + 1` 
      })
      .where(eq(promotions.id, id))
      .returning();
    return result[0];
  }

  async deactivatePromotion(id: number): Promise<Promotion | undefined> {
    const result = await db.update(promotions)
      .set({ active: false })
      .where(eq(promotions.id, id))
      .returning();
    return result[0];
  }
}

class MemoryStorage implements IStorage {
  sessionStore: session.Store;
  private usersData: User[] = [];
  private servicesData: Service[] = [];
  private tracksData: Track[] = [];
  private bookingsData: Booking[] = [];
  private messagesData: Message[] = [];
  private timeSlotsData: TimeSlot[] = [];
  private beatsData: Beat[] = [];
  private beatPurchasesData: BeatPurchase[] = [];
  private contractsData: Contract[] = [];
  private contractSignaturesData: ContractSignature[] = [];
  private feedbacksData: Feedback[] = [];
  private promotionsData: Promotion[] = [];
  private loyaltyRecordsData: LoyaltyRecord[] = [];
  private ids: Record<string, number> = {};

  constructor() {
    this.sessionStore = new session.MemoryStore();
    this.seed();
  }

  private nextId(key: string) {
    this.ids[key] = (this.ids[key] || 0) + 1;
    return this.ids[key];
  }

  private seed() {
    this.servicesData = [
      { id: this.nextId("services"), name: "Recording Session", description: "Professional vocal and instrument recording with an experienced engineer.", price: 7500, duration: 60, features: ["Engineer included", "Vocal chain setup", "Session files"] },
      { id: this.nextId("services"), name: "Mixing & Mastering", description: "Polished mix and master for release-ready records.", price: 15000, duration: 120, features: ["Stereo mix", "Mastered WAV/MP3", "Two revisions"] },
      { id: this.nextId("services"), name: "Production Consultation", description: "Creative direction, arrangement feedback, and release planning.", price: 5000, duration: 60, features: ["Song review", "Production notes", "Next-step plan"] },
    ];

    this.beatsData = [
      {
        id: this.nextId("beats"),
        title: "Midnight Session",
        genre: "Rap/Hip Hop",
        description: "Smooth keys, tight drums, and plenty of room for a focused vocal.",
        previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        fullAudioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        imageUrl: null,
        bpm: 92,
        price: 3500,
        licensingOptions: { basic: 35, premium: 75, exclusive: 250 },
        contractUrl: null,
        tags: ["smooth", "studio", "hip-hop"],
        featured: true,
        createdAt: new Date(),
      },
      {
        id: this.nextId("beats"),
        title: "After Hours Bounce",
        genre: "Trap",
        description: "Hard drums with melodic bounce for hooks and high-energy verses.",
        previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        fullAudioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        imageUrl: null,
        bpm: 140,
        price: 4500,
        licensingOptions: { basic: 45, premium: 90, exclusive: 300 },
        contractUrl: null,
        tags: ["trap", "bounce", "melodic"],
        featured: true,
        createdAt: new Date(),
      },
    ];

    this.contractsData = [
      {
        id: this.nextId("contracts"),
        title: "Studio Rules & Policies",
        description: "Studio booking, conduct, cancellation, and session-file policies.",
        content: "A 25% non-refundable deposit is required to secure bookings. Please arrive on time, respect the studio, and bring properly labeled session files.",
        fileUrl: "https://storage.googleapis.com/musiclifestudios/contracts/studio_rules.pdf",
        fileType: "pdf",
        category: "studio_rules",
        version: 1,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  async getUser(id: number) { return this.usersData.find((user) => user.id === id); }
  async getUserByUsername(username: string) { return this.usersData.find((user) => user.username === username); }
  async getUserByEmail(email: string) { return this.usersData.find((user) => user.email === email); }
  async createUser(user: InsertUser) {
    const newUser = { id: this.nextId("users"), firstName: null, lastName: null, phone: null, sessionCount: 0, loyaltyPoints: 0, createdAt: new Date(), lastLogin: null, ...user, role: user.role ?? "customer" } as User;
    this.usersData.push(newUser);
    return newUser;
  }
  async updateUser(id: number, userData: Partial<User>) { return this.updateById(this.usersData, id, userData); }
  async updateUserLoginTime(id: number) { return this.updateUser(id, { lastLogin: new Date() }); }
  async updateUserLoyaltyPoints(id: number, points: number) {
    const user = await this.getUser(id);
    return user ? this.updateUser(id, { loyaltyPoints: user.loyaltyPoints + points }) : undefined;
  }
  async incrementUserSessionCount(id: number) {
    const user = await this.getUser(id);
    return user ? this.updateUser(id, { sessionCount: user.sessionCount + 1 }) : undefined;
  }
  async getUserBookings(userId: number) { return this.bookingsData.filter((booking) => booking.userId === userId); }

  async getLoyaltyRecords(userId: number) { return this.loyaltyRecordsData.filter((record) => record.userId === userId); }
  async createLoyaltyRecord(record: InsertLoyaltyRecord) {
    const newRecord = { id: this.nextId("loyaltyRecords"), bookingId: null, createdAt: new Date(), ...record } as LoyaltyRecord;
    this.loyaltyRecordsData.push(newRecord);
    return newRecord;
  }

  async getAllPromotions() { return this.promotionsData; }
  async getActivePromotions() { return this.promotionsData.filter((promotion) => promotion.active); }
  async getPromotion(id: number) { return this.promotionsData.find((promotion) => promotion.id === id); }
  async getPromotionByCode(code: string) { return this.promotionsData.find((promotion) => promotion.code.toLowerCase() === code.toLowerCase()); }
  async createPromotion(promotion: InsertPromotion) {
    const newPromotion = { id: this.nextId("promotions"), minPurchase: null, maxDiscount: null, usageLimit: null, usageCount: 0, createdAt: new Date(), ...promotion } as Promotion;
    this.promotionsData.push(newPromotion);
    return newPromotion;
  }
  async updatePromotion(id: number, promotion: Partial<InsertPromotion>) { return this.updateById(this.promotionsData, id, promotion); }
  async incrementPromotionUsage(id: number) {
    const promotion = await this.getPromotion(id);
    return promotion ? this.updateById(this.promotionsData, id, { usageCount: promotion.usageCount + 1 }) : undefined;
  }
  async deactivatePromotion(id: number) { return this.updateById(this.promotionsData, id, { active: false }); }

  async getAllServices() { return this.servicesData; }
  async getService(id: number) { return this.servicesData.find((service) => service.id === id); }
  async createService(service: InsertService) {
    const newService = { id: this.nextId("services"), ...service } as Service;
    this.servicesData.push(newService);
    return newService;
  }
  async updateService(id: number, service: Partial<InsertService>) { return this.updateById(this.servicesData, id, service); }
  async deleteService(id: number) { return this.deleteById(this.servicesData, id); }

  async getAllTracks() { return this.tracksData; }
  async getTrack(id: number) { return this.tracksData.find((track) => track.id === id); }
  async createTrack(track: InsertTrack) {
    const newTrack = { id: this.nextId("tracks"), imageUrl: null, category: null, sampleType: null, ...track } as Track;
    this.tracksData.push(newTrack);
    return newTrack;
  }
  async updateTrack(id: number, track: Partial<InsertTrack>) { return this.updateById(this.tracksData, id, track); }
  async deleteTrack(id: number) { return this.deleteById(this.tracksData, id); }

  async getAllBookings() { return this.bookingsData; }
  async getBooking(id: number) { return this.bookingsData.find((booking) => booking.id === id); }
  async createBooking(booking: InsertBooking) {
    const newBooking = { id: this.nextId("bookings"), userId: null, phone: null, details: null, status: "pending", paymentIntentId: null, paymentStatus: "unpaid", tipAmount: 0, transactionId: null, paymentMethod: null, paymentErrorMessage: null, paymentMetadata: null, discountCode: null, discountAmount: null, loyaltyApplied: false, createdAt: new Date(), ...booking } as Booking;
    this.bookingsData.push(newBooking);
    return newBooking;
  }
  async updateBooking(id: number, booking: Partial<InsertBooking>) { return this.updateById(this.bookingsData, id, booking); }
  async updateBookingPayment(id: number, paymentIntentId: string, status: string) { return this.updateById(this.bookingsData, id, { transactionId: paymentIntentId, paymentStatus: status }); }
  async updateBookingTransactionInfo(id: number, transactionInfo: { transactionId: string; paymentStatus: string; paymentMethod?: string; paymentErrorMessage?: string; paymentMetadata?: any; tipAmount?: number; }) {
    return this.updateById(this.bookingsData, id, transactionInfo);
  }
  async deleteBooking(id: number) { return this.deleteById(this.bookingsData, id); }

  async getAllMessages() { return this.messagesData; }
  async getMessage(id: number) { return this.messagesData.find((message) => message.id === id); }
  async createMessage(message: InsertMessage) {
    const newMessage = { id: this.nextId("messages"), read: false, createdAt: new Date(), ...message } as Message;
    this.messagesData.push(newMessage);
    return newMessage;
  }
  async markMessageAsRead(id: number) { return this.updateById(this.messagesData, id, { read: true }); }
  async deleteMessage(id: number) { return this.deleteById(this.messagesData, id); }

  async getAllTimeSlots() { return this.timeSlotsData; }
  async getAvailableTimeSlots(startDate: Date, endDate: Date) {
    return this.timeSlotsData.filter((slot) => slot.available && slot.date >= startDate && slot.date <= endDate);
  }
  async createTimeSlot(timeSlot: InsertTimeSlot) {
    const newTimeSlot = { id: this.nextId("timeSlots"), bookingId: null, ...timeSlot } as TimeSlot;
    this.timeSlotsData.push(newTimeSlot);
    return newTimeSlot;
  }
  async bookTimeSlot(id: number, bookingId: number) { return this.updateById(this.timeSlotsData, id, { available: false, bookingId }); }
  async releaseTimeSlot(id: number) { return this.updateById(this.timeSlotsData, id, { available: true, bookingId: null }); }
  async createWeeklySchedule(startDate: Date, endDate: Date, dailyStartTime: string, dailyEndTime: string, slotDuration: number, daysOfWeek: number[]) {
    const created: TimeSlot[] = [];
    const [startHour, startMinute] = dailyStartTime.split(":").map(Number);
    const [endHour, endMinute] = dailyEndTime.split(":").map(Number);
    for (const current = new Date(startDate); current <= endDate; current.setDate(current.getDate() + 1)) {
      if (!daysOfWeek.includes(current.getDay())) continue;
      const slot = new Date(current);
      slot.setHours(startHour, startMinute, 0, 0);
      const end = new Date(current);
      end.setHours(endHour, endMinute, 0, 0);
      while (slot < end) {
        created.push(await this.createTimeSlot({ date: new Date(slot), available: true }));
        slot.setMinutes(slot.getMinutes() + slotDuration);
      }
    }
    return created;
  }
  async deleteTimeSlotsByDateRange(startDate: Date, endDate: Date) {
    this.timeSlotsData = this.timeSlotsData.filter((slot) => slot.date < startDate || slot.date > endDate);
    return true;
  }

  async getAllBeats() { return this.beatsData; }
  async getFeaturedBeats() { return this.beatsData.filter((beat) => beat.featured); }
  async getBeatsByGenre(genre: string) { return this.beatsData.filter((beat) => beat.genre === genre); }
  async getBeat(id: number) { return this.beatsData.find((beat) => beat.id === id); }
  async createBeat(beat: InsertBeat) {
    const newBeat = { id: this.nextId("beats"), imageUrl: null, contractUrl: null, tags: null, featured: false, createdAt: new Date(), licensingOptions: {}, ...beat } as Beat;
    this.beatsData.push(newBeat);
    return newBeat;
  }
  async updateBeat(id: number, beat: Partial<InsertBeat>) { return this.updateById(this.beatsData, id, beat); }
  async deleteBeat(id: number) { return this.deleteById(this.beatsData, id); }

  async getAllBeatPurchases() { return this.beatPurchasesData; }
  async getBeatPurchasesByBeat(beatId: number) { return this.beatPurchasesData.filter((purchase) => purchase.beatId === beatId); }
  async getBeatPurchasesByEmail(email: string) { return this.beatPurchasesData.filter((purchase) => purchase.customerEmail === email); }
  async getBeatPurchase(id: number) { return this.beatPurchasesData.find((purchase) => purchase.id === id); }
  async createBeatPurchase(purchase: InsertBeatPurchase) {
    const newPurchase = { id: this.nextId("beatPurchases"), downloadCount: 0, contractSigned: false, contractSignedAt: null, purchaseDate: new Date(), ...purchase } as BeatPurchase;
    this.beatPurchasesData.push(newPurchase);
    return newPurchase;
  }
  async updateBeatPurchaseContract(id: number, contractSigned: boolean) { return this.updateById(this.beatPurchasesData, id, { contractSigned, contractSignedAt: contractSigned ? new Date() : null }); }
  async incrementBeatPurchaseDownloadCount(id: number) {
    const purchase = await this.getBeatPurchase(id);
    return purchase ? this.updateById(this.beatPurchasesData, id, { downloadCount: (purchase.downloadCount || 0) + 1 }) : undefined;
  }

  async getAllContracts() { return this.contractsData; }
  async getContractsByCategory(category: string) { return this.contractsData.filter((contract) => contract.category === category); }
  async getActiveContracts() { return this.contractsData.filter((contract) => contract.active); }
  async getContract(id: number) { return this.contractsData.find((contract) => contract.id === id); }
  async createContract(contract: InsertContract) {
    const newContract = { id: this.nextId("contracts"), version: 1, active: true, createdAt: new Date(), updatedAt: new Date(), ...contract } as Contract;
    this.contractsData.push(newContract);
    return newContract;
  }
  async updateContract(id: number, contract: Partial<InsertContract>) { return this.updateById(this.contractsData, id, { ...contract, updatedAt: new Date() }); }
  async incrementContractVersion(id: number) {
    const contract = await this.getContract(id);
    return contract ? this.updateById(this.contractsData, id, { version: contract.version + 1, updatedAt: new Date() }) : undefined;
  }
  async setContractActive(id: number, active: boolean) { return this.updateById(this.contractsData, id, { active, updatedAt: new Date() }); }
  async deleteContract(id: number) { return this.deleteById(this.contractsData, id); }

  async getAllContractSignatures() { return this.contractSignaturesData; }
  async getContractSignature(id: number) { return this.contractSignaturesData.find((signature) => signature.id === id); }
  async getContractSignaturesByContract(contractId: number) { return this.contractSignaturesData.filter((signature) => signature.contractId === contractId); }
  async getContractSignaturesByEmail(email: string) { return this.contractSignaturesData.filter((signature) => signature.customerEmail === email); }
  async getContractSignatureByEntityAndEmail(relatedEntityType: string, relatedEntityId: number, email: string) {
    return this.contractSignaturesData.find((signature) => signature.relatedEntityType === relatedEntityType && signature.relatedEntityId === relatedEntityId && signature.customerEmail === email);
  }
  async createContractSignature(signature: InsertContractSignature) {
    const newSignature = { id: this.nextId("contractSignatures"), ipAddress: null, relatedEntityType: null, relatedEntityId: null, createdAt: new Date(), ...signature } as ContractSignature;
    this.contractSignaturesData.push(newSignature);
    return newSignature;
  }
  async verifyContractSigned(contractId: number, email: string) {
    return this.contractSignaturesData.some((signature) => signature.contractId === contractId && signature.customerEmail === email);
  }

  async getAllFeedbacks() { return this.feedbacksData; }
  async getFeedback(id: number) { return this.feedbacksData.find((feedback) => feedback.id === id); }
  async getFeedbacksByBooking(bookingId: number) { return this.feedbacksData.filter((feedback) => feedback.bookingId === bookingId); }
  async getFeedbacksByBeatPurchase(beatPurchaseId: number) { return this.feedbacksData.filter((feedback) => feedback.beatPurchaseId === beatPurchaseId); }
  async getFeedbacksByServiceType(serviceType: string) { return this.feedbacksData.filter((feedback) => feedback.serviceType === serviceType); }
  async createFeedback(feedback: InsertFeedback) {
    const newFeedback = { id: this.nextId("feedbacks"), userId: null, bookingId: null, beatPurchaseId: null, name: null, email: null, comment: null, status: "active", createdAt: new Date(), updatedAt: new Date(), ...feedback } as Feedback;
    this.feedbacksData.push(newFeedback);
    return newFeedback;
  }
  async updateFeedbackStatus(id: number, status: string) { return this.updateById(this.feedbacksData, id, { status, updatedAt: new Date() }); }
  async deleteFeedback(id: number) { return this.deleteById(this.feedbacksData, id); }
  async getFeedbackStats() {
    const totalFeedbacks = this.feedbacksData.length;
    const averageRating = totalFeedbacks ? this.feedbacksData.reduce((sum, feedback) => sum + feedback.rating, 0) / totalFeedbacks : 0;
    const ratingDistribution = this.feedbacksData.reduce<Record<string, number>>((acc, feedback) => {
      acc[feedback.rating] = (acc[feedback.rating] || 0) + 1;
      return acc;
    }, {});
    return { averageRating, totalFeedbacks, ratingDistribution };
  }

  private updateById<T extends { id: number }>(items: T[], id: number, patch: object): T | undefined {
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return undefined;
    items[index] = { ...items[index], ...patch };
    return items[index];
  }

  private deleteById<T extends { id: number }>(items: T[], id: number) {
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return false;
    items.splice(index, 1);
    return true;
  }
}

export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemoryStorage();
