import { 
  users, type User, type InsertUser,
  services, type Service, type InsertService,
  tracks, type Track, type InsertTrack,
  bookings, type Booking, type InsertBooking,
  messages, type Message, type InsertMessage,
  timeSlots, type TimeSlot, type InsertTimeSlot,
  beats, type Beat, type InsertBeat,
  beatPurchases, type BeatPurchase, type InsertBeatPurchase,
  contracts, type Contract, type InsertContract,
  contractSignatures, type ContractSignature, type InsertContractSignature,
  feedbacks, type Feedback, type InsertFeedback
} from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private services: Map<number, Service>;
  private tracks: Map<number, Track>;
  private bookings: Map<number, Booking>;
  private messages: Map<number, Message>;
  private timeSlots: Map<number, TimeSlot>;
  private beats: Map<number, Beat>;
  private beatPurchases: Map<number, BeatPurchase>;
  private contracts: Map<number, Contract>;
  private contractSignatures: Map<number, ContractSignature>;
  private feedbacks: Map<number, Feedback>;
  
  private userCurrentId: number;
  private serviceCurrentId: number;
  private trackCurrentId: number;
  private bookingCurrentId: number;
  private messageCurrentId: number;
  private timeSlotCurrentId: number;
  private beatCurrentId: number;
  private beatPurchaseCurrentId: number;
  private contractCurrentId: number;
  private contractSignatureCurrentId: number;
  private feedbackCurrentId: number;

  constructor() {
    this.users = new Map();
    this.services = new Map();
    this.tracks = new Map();
    this.bookings = new Map();
    this.messages = new Map();
    this.timeSlots = new Map();
    this.beats = new Map();
    this.beatPurchases = new Map();
    this.contracts = new Map();
    this.contractSignatures = new Map();
    this.feedbacks = new Map();
    
    this.userCurrentId = 1;
    this.serviceCurrentId = 1;
    this.trackCurrentId = 1;
    this.bookingCurrentId = 1;
    this.messageCurrentId = 1;
    this.timeSlotCurrentId = 1;
    this.beatCurrentId = 1;
    this.beatPurchaseCurrentId = 1;
    this.contractCurrentId = 1;
    this.contractSignatureCurrentId = 1;
    this.feedbackCurrentId = 1;
    
    // Add default admin user
    this.createUser({
      username: "admin",
      password: "admin123" // In a real app, this would be hashed
    });
    
    // Add default services
    this.createService({
      name: "Recording Session",
      description: "Professional studio recording with state-of-the-art equipment and acoustically-treated space.",
      price: 7500, // $75 per hour
      duration: 60, // 1 hour
      features: ["Up to 8 hours of studio time", "Multiple track recording", "Basic editing included"]
    });
    
    this.createService({
      name: "Mixing & Mastering",
      description: "Polished, industry-standard mixes and masters to make your music shine on any platform.",
      price: 12000, // $120 per hour
      duration: 60, // 1 hour
      features: ["Detailed mixing process", "Professional mastering", "Up to 3 revisions included"]
    });
    
    this.createService({
      name: "Production & Composition",
      description: "Custom music production and composition services for artists, brands, and media projects.",
      price: 17500, // $175 per hour
      duration: 60, // 1 hour
      features: ["Original music creation", "Arrangement and production", "Session musicians available"]
    });
    
    // Create sample tracks
    this.createTrack({
      title: "Electric Dreams",
      description: "Synthwave Project - Mixed & Mastered",
      audioUrl: "https://example.com/audio/electric-dreams.mp3",
      imageUrl: "https://example.com/images/electric-dreams.jpg",
      type: "mixing"
    });
    
    this.createTrack({
      title: "Summer Vibes EP",
      description: "Recording & Production",
      audioUrl: "https://example.com/audio/summer-vibes.mp3",
      imageUrl: "https://example.com/images/summer-vibes.jpg",
      type: "recording"
    });
    
    this.createTrack({
      title: "Midnight Blue",
      description: "Mixing & Mastering",
      audioUrl: "https://example.com/audio/midnight-blue.mp3",
      imageUrl: "https://example.com/images/midnight-blue.jpg",
      type: "mixing"
    });
    
    this.createTrack({
      title: "Urban Echoes",
      description: "Full Production",
      audioUrl: "https://example.com/audio/urban-echoes.mp3",
      imageUrl: "https://example.com/images/urban-echoes.jpg",
      type: "production"
    });
    
    this.createTrack({
      title: "Acoustic Sessions",
      description: "Recording & Mixing",
      audioUrl: "https://example.com/audio/acoustic-sessions.mp3",
      imageUrl: "https://example.com/images/acoustic-sessions.jpg",
      type: "recording"
    });
    
    // Create time slots for the next 30 days
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      
      // Create 3 time slots per day (10 AM, 2 PM, 6 PM)
      const slot1 = new Date(date);
      slot1.setHours(10, 0, 0, 0);
      
      const slot2 = new Date(date);
      slot2.setHours(14, 0, 0, 0);
      
      const slot3 = new Date(date);
      slot3.setHours(18, 0, 0, 0);
      
      this.createTimeSlot({ date: slot1, available: true });
      this.createTimeSlot({ date: slot2, available: true });
      this.createTimeSlot({ date: slot3, available: true });
    }
    
    // Create sample beats
    this.createBeat({
      title: "Summer Heat",
      genre: "Hip Hop",
      description: "Upbeat summer vibe with catchy hooks and thick bass",
      previewUrl: "https://example.com/audio/previews/summer-heat.mp3",
      fullAudioUrl: "https://example.com/audio/full/summer-heat.mp3",
      imageUrl: "https://example.com/images/beats/summer-heat.jpg",
      bpm: 95,
      price: 4999, // $49.99
      licensingOptions: {
        basic: {
          price: 4999,
          description: "MP3 file, non-exclusive rights, personal use only",
          allowsSelling: false,
          distribution: 1000
        },
        premium: {
          price: 9999,
          description: "WAV file, non-exclusive rights, distribute up to 5,000 copies",
          allowsSelling: true,
          distribution: 5000
        },
        exclusive: {
          price: 29999,
          description: "Full rights transfer, unrestricted use, stems included",
          allowsSelling: true,
          distribution: "unlimited"
        }
      },
      contractUrl: "https://example.com/contracts/standard-license.pdf",
      tags: ["summer", "hip-hop", "chill", "upbeat"],
      featured: true
    });
    
    this.createBeat({
      title: "Midnight Drive",
      genre: "R&B",
      description: "Smooth R&B track with atmospheric pads and punchy drums",
      previewUrl: "https://example.com/audio/previews/midnight-drive.mp3",
      fullAudioUrl: "https://example.com/audio/full/midnight-drive.mp3",
      imageUrl: "https://example.com/images/beats/midnight-drive.jpg",
      bpm: 72,
      price: 3999, // $39.99
      licensingOptions: {
        basic: {
          price: 3999,
          description: "MP3 file, non-exclusive rights, personal use only",
          allowsSelling: false,
          distribution: 1000
        },
        premium: {
          price: 7999,
          description: "WAV file, non-exclusive rights, distribute up to 5,000 copies",
          allowsSelling: true,
          distribution: 5000
        },
        exclusive: {
          price: 19999,
          description: "Full rights transfer, unrestricted use, stems included",
          allowsSelling: true,
          distribution: "unlimited"
        }
      },
      contractUrl: "https://example.com/contracts/standard-license.pdf",
      tags: ["r&b", "smooth", "night", "chill"],
      featured: true
    });
    
    this.createBeat({
      title: "Trap Kingdom",
      genre: "Trap",
      description: "Hard-hitting trap beat with modern 808s and dark melodies",
      previewUrl: "https://example.com/audio/previews/trap-kingdom.mp3",
      fullAudioUrl: "https://example.com/audio/full/trap-kingdom.mp3",
      imageUrl: "https://example.com/images/beats/trap-kingdom.jpg",
      bpm: 140,
      price: 5999, // $59.99
      licensingOptions: {
        basic: {
          price: 5999,
          description: "MP3 file, non-exclusive rights, personal use only",
          allowsSelling: false,
          distribution: 1000
        },
        premium: {
          price: 11999,
          description: "WAV file, non-exclusive rights, distribute up to 5,000 copies",
          allowsSelling: true,
          distribution: 5000
        },
        exclusive: {
          price: 34999,
          description: "Full rights transfer, unrestricted use, stems included",
          allowsSelling: true,
          distribution: "unlimited"
        }
      },
      contractUrl: "https://example.com/contracts/standard-license.pdf",
      tags: ["trap", "dark", "808", "hard"],
      featured: false
    });
    
    // Add sample contracts
    this.createContract({
      title: "Beat License Agreement",
      description: "Standard licensing agreement for non-exclusive beat usage",
      fileUrl: "https://example.com/contracts/beat-license-agreement.pdf",
      fileType: "pdf",
      category: "licensing"
    });
    
    this.createContract({
      title: "Studio Session Agreement",
      description: "Terms and conditions for booking studio sessions",
      fileUrl: "https://example.com/contracts/studio-session-agreement.pdf",
      fileType: "pdf",
      category: "services"
    });
    
    this.createContract({
      title: "Exclusive Rights Transfer",
      description: "Contract for transferring exclusive rights to a beat",
      fileUrl: "https://example.com/contracts/exclusive-rights-transfer.pdf",
      fileType: "pdf",
      category: "licensing"
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Services
  async getAllServices(): Promise<Service[]> {
    return Array.from(this.services.values());
  }
  
  async getService(id: number): Promise<Service | undefined> {
    return this.services.get(id);
  }
  
  async createService(service: InsertService): Promise<Service> {
    const id = this.serviceCurrentId++;
    const newService: Service = { ...service, id };
    this.services.set(id, newService);
    return newService;
  }
  
  async updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined> {
    const existingService = this.services.get(id);
    if (!existingService) return undefined;
    
    const updatedService = { ...existingService, ...service };
    this.services.set(id, updatedService);
    return updatedService;
  }
  
  async deleteService(id: number): Promise<boolean> {
    return this.services.delete(id);
  }
  
  // Tracks
  async getAllTracks(): Promise<Track[]> {
    return Array.from(this.tracks.values());
  }
  
  async getTrack(id: number): Promise<Track | undefined> {
    return this.tracks.get(id);
  }
  
  async createTrack(track: InsertTrack): Promise<Track> {
    const id = this.trackCurrentId++;
    const newTrack: Track = { ...track, id };
    this.tracks.set(id, newTrack);
    return newTrack;
  }
  
  async updateTrack(id: number, track: Partial<InsertTrack>): Promise<Track | undefined> {
    const existingTrack = this.tracks.get(id);
    if (!existingTrack) return undefined;
    
    const updatedTrack = { ...existingTrack, ...track };
    this.tracks.set(id, updatedTrack);
    return updatedTrack;
  }
  
  async deleteTrack(id: number): Promise<boolean> {
    return this.tracks.delete(id);
  }
  
  // Bookings
  async getAllBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values());
  }
  
  async getBooking(id: number): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }
  
  async createBooking(booking: InsertBooking): Promise<Booking> {
    const id = this.bookingCurrentId++;
    const newBooking: Booking = { 
      ...booking, 
      id, 
      createdAt: new Date(),
      status: "pending",
      paymentStatus: "unpaid"
    };
    this.bookings.set(id, newBooking);
    return newBooking;
  }
  
  async updateBooking(id: number, booking: Partial<InsertBooking>): Promise<Booking | undefined> {
    const existingBooking = this.bookings.get(id);
    if (!existingBooking) return undefined;
    
    const updatedBooking = { ...existingBooking, ...booking };
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }
  
  async updateBookingPayment(id: number, paymentIntentId: string, status: string): Promise<Booking | undefined> {
    const existingBooking = this.bookings.get(id);
    if (!existingBooking) return undefined;
    
    const updatedBooking = { 
      ...existingBooking, 
      paymentIntentId, 
      paymentStatus: status 
    };
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }
  
  async updateBookingTransactionInfo(id: number, transactionInfo: {
    transactionId: string;
    paymentStatus: string;
    paymentMethod?: string;
    paymentErrorMessage?: string;
    paymentMetadata?: any;
    tipAmount?: number;
  }): Promise<Booking | undefined> {
    const existingBooking = this.bookings.get(id);
    if (!existingBooking) return undefined;
    
    const updatedBooking = { 
      ...existingBooking, 
      transactionId: transactionInfo.transactionId,
      paymentStatus: transactionInfo.paymentStatus,
      paymentMethod: transactionInfo.paymentMethod || existingBooking.paymentMethod,
      paymentErrorMessage: transactionInfo.paymentErrorMessage,
      paymentMetadata: transactionInfo.paymentMetadata,
      tipAmount: transactionInfo.tipAmount
    };
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }
  
  async deleteBooking(id: number): Promise<boolean> {
    return this.bookings.delete(id);
  }
  
  // Messages
  async getAllMessages(): Promise<Message[]> {
    return Array.from(this.messages.values());
  }
  
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }
  
  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.messageCurrentId++;
    const newMessage: Message = { 
      ...message, 
      id, 
      read: false,
      createdAt: new Date()
    };
    this.messages.set(id, newMessage);
    return newMessage;
  }
  
  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const existingMessage = this.messages.get(id);
    if (!existingMessage) return undefined;
    
    const updatedMessage = { ...existingMessage, read: true };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }
  
  async deleteMessage(id: number): Promise<boolean> {
    return this.messages.delete(id);
  }
  
  // Time Slots
  async getAllTimeSlots(): Promise<TimeSlot[]> {
    return Array.from(this.timeSlots.values());
  }
  
  async getAvailableTimeSlots(startDate: Date, endDate: Date): Promise<TimeSlot[]> {
    return Array.from(this.timeSlots.values()).filter(
      (slot) => 
        slot.available && 
        slot.date >= startDate && 
        slot.date <= endDate
    );
  }
  
  async createTimeSlot(timeSlot: InsertTimeSlot): Promise<TimeSlot> {
    const id = this.timeSlotCurrentId++;
    const newTimeSlot: TimeSlot = { 
      ...timeSlot, 
      id, 
      bookingId: null
    };
    this.timeSlots.set(id, newTimeSlot);
    return newTimeSlot;
  }
  
  async bookTimeSlot(id: number, bookingId: number): Promise<TimeSlot | undefined> {
    const existingTimeSlot = this.timeSlots.get(id);
    if (!existingTimeSlot || !existingTimeSlot.available) return undefined;
    
    const updatedTimeSlot = { 
      ...existingTimeSlot, 
      available: false,
      bookingId
    };
    this.timeSlots.set(id, updatedTimeSlot);
    return updatedTimeSlot;
  }
  
  async releaseTimeSlot(id: number): Promise<TimeSlot | undefined> {
    const existingTimeSlot = this.timeSlots.get(id);
    if (!existingTimeSlot) return undefined;
    
    const updatedTimeSlot = { 
      ...existingTimeSlot, 
      available: true,
      bookingId: null
    };
    this.timeSlots.set(id, updatedTimeSlot);
    return updatedTimeSlot;
  }
  
  // Beats
  async getAllBeats(): Promise<Beat[]> {
    return Array.from(this.beats.values());
  }
  
  async getFeaturedBeats(): Promise<Beat[]> {
    return Array.from(this.beats.values()).filter(beat => beat.featured);
  }
  
  async getBeatsByGenre(genre: string): Promise<Beat[]> {
    return Array.from(this.beats.values()).filter(
      beat => beat.genre.toLowerCase() === genre.toLowerCase()
    );
  }
  
  async getBeat(id: number): Promise<Beat | undefined> {
    return this.beats.get(id);
  }
  
  async createBeat(beat: InsertBeat): Promise<Beat> {
    const id = this.beatCurrentId++;
    const newBeat: Beat = { 
      ...beat, 
      id, 
      createdAt: new Date()
    };
    this.beats.set(id, newBeat);
    return newBeat;
  }
  
  async updateBeat(id: number, beat: Partial<InsertBeat>): Promise<Beat | undefined> {
    const existingBeat = this.beats.get(id);
    if (!existingBeat) return undefined;
    
    const updatedBeat = { ...existingBeat, ...beat };
    this.beats.set(id, updatedBeat);
    return updatedBeat;
  }
  
  async deleteBeat(id: number): Promise<boolean> {
    return this.beats.delete(id);
  }
  
  // Beat Purchases
  async getAllBeatPurchases(): Promise<BeatPurchase[]> {
    return Array.from(this.beatPurchases.values());
  }
  
  async getBeatPurchasesByBeat(beatId: number): Promise<BeatPurchase[]> {
    return Array.from(this.beatPurchases.values()).filter(
      purchase => purchase.beatId === beatId
    );
  }
  
  async getBeatPurchasesByEmail(email: string): Promise<BeatPurchase[]> {
    return Array.from(this.beatPurchases.values()).filter(
      purchase => purchase.customerEmail.toLowerCase() === email.toLowerCase()
    );
  }
  
  async getBeatPurchase(id: number): Promise<BeatPurchase | undefined> {
    return this.beatPurchases.get(id);
  }
  
  async createBeatPurchase(purchase: InsertBeatPurchase): Promise<BeatPurchase> {
    const id = this.beatPurchaseCurrentId++;
    const newPurchase: BeatPurchase = { 
      ...purchase, 
      id,
      downloadCount: 0,
      contractSigned: false,
      contractSignedAt: null,
      purchaseDate: new Date()
    };
    this.beatPurchases.set(id, newPurchase);
    return newPurchase;
  }
  
  async updateBeatPurchaseContract(id: number, contractSigned: boolean): Promise<BeatPurchase | undefined> {
    const existingPurchase = this.beatPurchases.get(id);
    if (!existingPurchase) return undefined;
    
    const updatedPurchase = { 
      ...existingPurchase, 
      contractSigned,
      contractSignedAt: contractSigned ? new Date() : null
    };
    this.beatPurchases.set(id, updatedPurchase);
    return updatedPurchase;
  }
  
  async incrementBeatPurchaseDownloadCount(id: number): Promise<BeatPurchase | undefined> {
    const existingPurchase = this.beatPurchases.get(id);
    if (!existingPurchase) return undefined;
    
    const updatedPurchase = { 
      ...existingPurchase, 
      downloadCount: (existingPurchase.downloadCount || 0) + 1
    };
    this.beatPurchases.set(id, updatedPurchase);
    return updatedPurchase;
  }

  // Contracts
  async getAllContracts(): Promise<Contract[]> {
    return Array.from(this.contracts.values());
  }
  
  async getContractsByCategory(category: string): Promise<Contract[]> {
    return Array.from(this.contracts.values()).filter(
      (contract) => contract.category === category
    );
  }
  
  async getActiveContracts(): Promise<Contract[]> {
    return Array.from(this.contracts.values()).filter(
      (contract) => contract.active
    );
  }
  
  async getContract(id: number): Promise<Contract | undefined> {
    return this.contracts.get(id);
  }
  
  async createContract(contract: InsertContract): Promise<Contract> {
    const id = this.contractCurrentId++;
    const newContract: Contract = { 
      ...contract, 
      id,
      version: 1,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.contracts.set(id, newContract);
    return newContract;
  }
  
  async updateContract(id: number, contract: Partial<InsertContract>): Promise<Contract | undefined> {
    const existingContract = this.contracts.get(id);
    if (!existingContract) return undefined;
    
    const updatedContract = { 
      ...existingContract, 
      ...contract,
      updatedAt: new Date()
    };
    this.contracts.set(id, updatedContract);
    return updatedContract;
  }
  
  async incrementContractVersion(id: number): Promise<Contract | undefined> {
    const existingContract = this.contracts.get(id);
    if (!existingContract) return undefined;
    
    const updatedContract = { 
      ...existingContract, 
      version: existingContract.version + 1,
      updatedAt: new Date()
    };
    this.contracts.set(id, updatedContract);
    return updatedContract;
  }
  
  async setContractActive(id: number, active: boolean): Promise<Contract | undefined> {
    const existingContract = this.contracts.get(id);
    if (!existingContract) return undefined;
    
    const updatedContract = { 
      ...existingContract, 
      active,
      updatedAt: new Date()
    };
    this.contracts.set(id, updatedContract);
    return updatedContract;
  }
  
  async deleteContract(id: number): Promise<boolean> {
    return this.contracts.delete(id);
  }
  
  // Contract Signatures
  async getAllContractSignatures(): Promise<ContractSignature[]> {
    return Array.from(this.contractSignatures.values());
  }
  
  async getContractSignature(id: number): Promise<ContractSignature | undefined> {
    return this.contractSignatures.get(id);
  }
  
  async getContractSignaturesByContract(contractId: number): Promise<ContractSignature[]> {
    return Array.from(this.contractSignatures.values()).filter(
      (signature) => signature.contractId === contractId
    );
  }
  
  async getContractSignaturesByEmail(email: string): Promise<ContractSignature[]> {
    return Array.from(this.contractSignatures.values()).filter(
      (signature) => signature.customerEmail === email
    );
  }
  
  async getContractSignatureByEntityAndEmail(relatedEntityType: string, relatedEntityId: number, email: string): Promise<ContractSignature | undefined> {
    return Array.from(this.contractSignatures.values()).find(
      (signature) => 
        signature.relatedEntityType === relatedEntityType && 
        signature.relatedEntityId === relatedEntityId && 
        signature.customerEmail === email
    );
  }
  
  async createContractSignature(signature: InsertContractSignature): Promise<ContractSignature> {
    const id = this.contractSignatureCurrentId++;
    const newSignature: ContractSignature = { 
      ...signature, 
      id,
      createdAt: new Date()
    };
    this.contractSignatures.set(id, newSignature);
    return newSignature;
  }
  
  async verifyContractSigned(contractId: number, email: string): Promise<boolean> {
    const signatures = await this.getContractSignaturesByContract(contractId);
    return signatures.some(sig => sig.customerEmail === email && sig.agreedToTerms);
  }

  // Feedback and ratings
  async getAllFeedbacks(): Promise<Feedback[]> {
    return Array.from(this.feedbacks.values());
  }

  async getFeedback(id: number): Promise<Feedback | undefined> {
    return this.feedbacks.get(id);
  }

  async getFeedbacksByBooking(bookingId: number): Promise<Feedback[]> {
    return Array.from(this.feedbacks.values()).filter(
      feedback => feedback.bookingId === bookingId
    );
  }

  async getFeedbacksByBeatPurchase(beatPurchaseId: number): Promise<Feedback[]> {
    return Array.from(this.feedbacks.values()).filter(
      feedback => feedback.beatPurchaseId === beatPurchaseId
    );
  }

  async getFeedbacksByServiceType(serviceType: string): Promise<Feedback[]> {
    return Array.from(this.feedbacks.values()).filter(
      feedback => feedback.serviceType === serviceType
    );
  }

  async createFeedback(feedback: InsertFeedback): Promise<Feedback> {
    const id = this.feedbackCurrentId++;
    const now = new Date();
    const newFeedback: Feedback = {
      ...feedback,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.feedbacks.set(id, newFeedback);
    return newFeedback;
  }

  async updateFeedbackStatus(id: number, status: string): Promise<Feedback | undefined> {
    const feedback = this.feedbacks.get(id);
    if (!feedback) return undefined;

    const updatedFeedback = {
      ...feedback,
      status,
      updatedAt: new Date()
    };
    this.feedbacks.set(id, updatedFeedback);
    return updatedFeedback;
  }

  async deleteFeedback(id: number): Promise<boolean> {
    return this.feedbacks.delete(id);
  }

  async getFeedbackStats(): Promise<{ 
    averageRating: number; 
    totalFeedbacks: number;
    ratingDistribution: Record<string, number>;
  }> {
    const feedbacks = Array.from(this.feedbacks.values()).filter(
      feedback => feedback.status === "active"
    );
    
    if (feedbacks.length === 0) {
      return {
        averageRating: 0,
        totalFeedbacks: 0,
        ratingDistribution: {
          "1": 0,
          "2": 0,
          "3": 0,
          "4": 0,
          "5": 0
        }
      };
    }

    const totalRating = feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0);
    const averageRating = totalRating / feedbacks.length;

    const ratingDistribution: Record<string, number> = {
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 0,
      "5": 0
    };

    feedbacks.forEach(feedback => {
      const rating = feedback.rating.toString();
      ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
    });

    return {
      averageRating,
      totalFeedbacks: feedbacks.length,
      ratingDistribution
    };
  }

  // Schedule management
  async createWeeklySchedule(
    startDate: Date, 
    endDate: Date, 
    dailyStartTime: string, 
    dailyEndTime: string, 
    slotDuration: number, 
    daysOfWeek: number[]
  ): Promise<TimeSlot[]> {
    const createdSlots: TimeSlot[] = [];
    const [startHour, startMinute] = dailyStartTime.split(':').map(Number);
    const [endHour, endMinute] = dailyEndTime.split(':').map(Number);
    
    const current = new Date(startDate);
    while (current <= endDate) {
      const dayOfWeek = current.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Check if this day of the week should be included
      if (daysOfWeek.includes(dayOfWeek)) {
        // Create slots for this day
        const slotStart = new Date(current);
        slotStart.setHours(startHour, startMinute, 0, 0);
        
        const slotEnd = new Date(current);
        slotEnd.setHours(endHour, endMinute, 0, 0);
        
        // Create time slots for this day
        while (slotStart < slotEnd) {
          const timeSlot = await this.createTimeSlot({
            date: new Date(slotStart),
            available: true
          });
          
          createdSlots.push(timeSlot);
          
          // Move to next slot
          slotStart.setMinutes(slotStart.getMinutes() + slotDuration);
        }
      }
      
      // Move to next day
      current.setDate(current.getDate() + 1);
    }
    
    return createdSlots;
  }
  
  async deleteTimeSlotsByDateRange(startDate: Date, endDate: Date): Promise<boolean> {
    let deletedAny = false;
    
    for (const [id, slot] of this.timeSlots.entries()) {
      if (slot.date >= startDate && slot.date <= endDate) {
        // Only delete if the slot is not booked
        if (!slot.bookingId) {
          this.timeSlots.delete(id);
          deletedAny = true;
        }
      }
    }
    
    return deletedAny;
  }
}

export const storage = new MemStorage();
