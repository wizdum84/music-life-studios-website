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
  createUser(user: InsertUser): Promise<User>;
  
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
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
      .set({ isRead: true })
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
    const result = await db.insert(beats).values(beat).returning();
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
    return db.select().from(beatPurchases).orderBy(desc(beatPurchases.createdAt));
  }

  async getBeatPurchasesByBeat(beatId: number): Promise<BeatPurchase[]> {
    return db.select()
      .from(beatPurchases)
      .where(eq(beatPurchases.beatId, beatId))
      .orderBy(desc(beatPurchases.createdAt));
  }

  async getBeatPurchasesByEmail(email: string): Promise<BeatPurchase[]> {
    return db.select()
      .from(beatPurchases)
      .where(eq(beatPurchases.email, email))
      .orderBy(desc(beatPurchases.createdAt));
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
    return db.select().from(contractSignatures).orderBy(desc(contractSignatures.signedAt));
  }

  async getContractSignature(id: number): Promise<ContractSignature | undefined> {
    const result = await db.select().from(contractSignatures).where(eq(contractSignatures.id, id)).limit(1);
    return result[0];
  }

  async getContractSignaturesByContract(contractId: number): Promise<ContractSignature[]> {
    return db.select()
      .from(contractSignatures)
      .where(eq(contractSignatures.contractId, contractId))
      .orderBy(desc(contractSignatures.signedAt));
  }

  async getContractSignaturesByEmail(email: string): Promise<ContractSignature[]> {
    return db.select()
      .from(contractSignatures)
      .where(eq(contractSignatures.email, email))
      .orderBy(desc(contractSignatures.signedAt));
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
          eq(contractSignatures.email, email)
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
          eq(contractSignatures.email, email)
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
}

export const storage = new DatabaseStorage();