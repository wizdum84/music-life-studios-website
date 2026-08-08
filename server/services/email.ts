import { Booking } from '@shared/schema';

/**
 * Send a booking confirmation email to the client
 * @param booking The booking details
 * @param transactionId The payment transaction ID
 */
export async function sendClientConfirmationEmail(booking: Booking, transactionId: string) {
  // In a real application, this would connect to an email service like SendGrid, Mailgun, etc.
  // For now, we'll just log the email that would be sent
  
  console.log(`
    [EMAIL SIMULATION] Sending booking confirmation to ${booking.email}
    
    SUBJECT: Music Life Studios - Booking Confirmation #${booking.id}
    
    Dear ${booking.name},
    
    Thank you for booking a session with Music Life Studios! Your booking has been confirmed.
    
    Booking Details:
    - Date: ${new Date(booking.date).toLocaleDateString()}
    - Time: ${new Date(booking.date).toLocaleTimeString()}
    - Duration: ${booking.duration / 60} hour(s)
    - Total Amount: $${(booking.amount / 100).toFixed(2)}
    - Payment Status: ${booking.paymentStatus}
    - Transaction ID: ${transactionId}
    
    Please arrive 15 minutes before your session start time. If you need to 
    reschedule or cancel, please contact us at least 24 hours in advance.
    
    We look forward to working with you!
    
    Best regards,
    Music Life Studios Team
    
    [This is a simulation, no actual email was sent]
  `);
  
  return true;
}

/**
 * Send a notification email to the admin about a new booking
 * @param booking The booking details
 * @param transactionId The payment transaction ID
 */
export async function sendAdminNotificationEmail(booking: Booking, transactionId: string) {
  // In a real application, this would connect to an email service
  
  console.log(`
    [EMAIL SIMULATION] Sending admin notification
    
    SUBJECT: New Booking #${booking.id} - Music Life Studios
    
    A new booking has been received and payment has been processed.
    
    Client: ${booking.name} (${booking.email})
    Date: ${new Date(booking.date).toLocaleDateString()}
    Time: ${new Date(booking.date).toLocaleTimeString()}
    Duration: ${booking.duration / 60} hour(s)
    Amount: $${(booking.amount / 100).toFixed(2)}
    Payment Status: ${booking.paymentStatus}
    Transaction ID: ${transactionId}
    
    Client Notes: ${booking.details || 'None provided'}
    
    [This is a simulation, no actual email was sent]
  `);
  
  return true;
}

export default {
  sendClientConfirmationEmail,
  sendAdminNotificationEmail
};
