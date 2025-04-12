import braintree from 'braintree';
import { Booking } from '@shared/schema';

/**
 * Create a Braintree gateway instance
 * Credentials will be loaded from environment variables
 */
export function createGateway() {
  // This will be replaced with actual credentials
  const merchantId = process.env.BRAINTREE_MERCHANT_ID || 'placeholder_merchant_id';
  const publicKey = process.env.BRAINTREE_PUBLIC_KEY || 'placeholder_public_key';
  const privateKey = process.env.BRAINTREE_PRIVATE_KEY || 'placeholder_private_key';

  return new braintree.BraintreeGateway({
    environment: braintree.Environment.Sandbox, // Use Production for live environment
    merchantId,
    publicKey,
    privateKey,
  });
}

const gateway = createGateway();

/**
 * Generate a client token for the frontend
 * The token allows the frontend to initialize Braintree SDK securely
 */
export async function generateClientToken() {
  try {
    const response = await gateway.clientToken.generate({});
    return response.clientToken;
  } catch (error) {
    console.error('Error generating client token:', error);
    throw error;
  }
}

/**
 * Process a payment using Braintree with provided payment method nonce
 * @param booking The booking object with payment details
 * @param paymentMethodNonce The nonce received from the frontend or Braintree hosted fields
 * @param isDeposit Whether this is a deposit payment (25% of total)
 */
export async function processPayment(
  booking: Booking, 
  paymentMethodNonce: string, 
  isDeposit: boolean = false
) {
  try {
    const amount = isDeposit ? 
      (booking.amount * 0.25 / 100).toFixed(2) : 
      (booking.amount / 100).toFixed(2);
    
    let discountAmount = 0;
    
    // Apply discount if a valid code is provided
    if (booking.discountCode) {
      // This would typically check against a database of valid codes
      // For now, we'll just simulate a 10% discount for any code
      discountAmount = parseFloat(amount) * 0.1;
    }
    
    const finalAmount = (parseFloat(amount) - discountAmount).toFixed(2);
    
    const response = await gateway.transaction.sale({
      amount: finalAmount,
      paymentMethodNonce,
      options: {
        submitForSettlement: true,
      },
      customer: {
        firstName: booking.name.split(' ')[0],
        lastName: booking.name.split(' ').slice(1).join(' ') || '',
        email: booking.email,
      },
      customFields: {
        booking_id: booking.id.toString(),
        service_id: booking.serviceId.toString(),
      },
    });

    if (response.success) {
      return {
        success: true,
        transaction: response.transaction,
        paymentStatus: isDeposit ? 'deposit_paid' : 'paid',
      };
    } else {
      return {
        success: false,
        errorMessage: response.message,
        errors: response.errors,
      };
    }
  } catch (error: any) {
    console.error('Error processing payment:', error);
    return {
      success: false,
      errorMessage: error.message || 'An error occurred while processing payment',
    };
  }
}

/**
 * Refund a transaction
 * @param transactionId The ID of the transaction to refund
 * @param amount Optional amount to refund (defaults to full amount)
 */
export async function refundTransaction(transactionId: string, amount?: string) {
  try {
    // First find the transaction to get its details
    const transaction = await gateway.transaction.find(transactionId);
    
    // Process the refund
    const response = await gateway.transaction.refund(
      transactionId,
      amount || transaction.amount
    );
    
    if (response.success) {
      return {
        success: true,
        transaction: response.transaction,
      };
    } else {
      return {
        success: false,
        errorMessage: response.message,
      };
    }
  } catch (error: any) {
    console.error('Error refunding transaction:', error);
    return {
      success: false,
      errorMessage: error.message || 'An error occurred while refunding the transaction',
    };
  }
}

/**
 * Search for transactions by criteria
 * @param criteria Search criteria
 */
export async function searchTransactions(criteria: any) {
  try {
    const response = await gateway.transaction.search((search) => {
      if (criteria.bookingId) {
        search.customFields().is('booking_id', criteria.bookingId.toString());
      }
      if (criteria.customerEmail) {
        search.customerEmail().is(criteria.customerEmail);
      }
      if (criteria.startDate && criteria.endDate) {
        search.createdAt().between(criteria.startDate, criteria.endDate);
      }
    });
    
    return {
      success: true,
      transactions: response,
    };
  } catch (error: any) {
    console.error('Error searching transactions:', error);
    return {
      success: false,
      errorMessage: error.message || 'An error occurred while searching transactions',
    };
  }
}

export default {
  gateway,
  generateClientToken,
  processPayment,
  refundTransaction,
  searchTransactions,
};