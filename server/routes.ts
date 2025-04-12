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

export async function registerRoutes(app: Express): Promise<Server> {
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

  const httpServer = createServer(app);
  return httpServer;
}
