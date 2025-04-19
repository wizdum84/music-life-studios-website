import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBookingSchema, insertMessageSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import session from "express-session";
import MemoryStore from "memorystore";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import * as braintreeService from "./services/braintree";
import * as emailService from "./services/email";

// Create default studio rules contract if it doesn't exist
async function ensureStudioRulesExist() {
  try {
    // Check if we already have a studio rules contract
    const existingRules = await storage.getContractsByCategory("studio_rules");
    
    if (existingRules && existingRules.length > 0) {
      return; // We already have studio rules
    }
    
    // Create default studio rules contract
    await storage.createContract({
      title: "Studio Rules & Policies",
      description: `MUSIC LIFE STUDIOS - STUDIO RULES & POLICIES

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

By signing this agreement, you acknowledge you have read and agree to comply with all studio rules and policies.`,
      fileUrl: "https://storage.googleapis.com/musiclifestudios/contracts/studio_rules.pdf",
      fileType: "pdf",
      category: "studio_rules",
    });
    
    console.log("Default studio rules contract created");
  } catch (error) {
    console.error("Error creating default studio rules contract:", error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Ensure studio rules exist when the server starts
  await ensureStudioRulesExist();
  // Session setup for admin authentication
  const MemoryStoreSession = MemoryStore(session);
  
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "soundcraft-session-secret",
      resave: false,
      saveUninitialized: false,
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // Prune expired entries every 24h
      }),
      cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
    })
  );
  
  // Set up passport for authentication
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Configure passport to use local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Incorrect username" });
        }
        
        // In a real app, you would compare hashed passwords
        if (user.password !== password) {
          return done(null, false, { message: "Incorrect password" });
        }
        
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );
  
  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });
  
  // Deserialize user from session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
  
  // Authentication middleware
  const isAuthenticated = (req: Request, res: Response, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };
  
  // API routes
  
  // Authentication routes
  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.json({ message: "Login successful", user: req.user });
  });
  
  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
  
  app.get("/api/check-auth", (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ authenticated: true, user: req.user });
    } else {
      res.json({ authenticated: false });
    }
  });
  
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
      const createdBooking = await storage.createBooking(booking);
      
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
          paymentStatus: booking.paymentStatus,  // Keep the original payment status
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
      const { title, description, fileUrl, fileType, category } = req.body;
      
      if (!title || !description || !fileUrl) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const newContract = await storage.createContract({
        title,
        description,
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

  const httpServer = createServer(app);
  return httpServer;
}
