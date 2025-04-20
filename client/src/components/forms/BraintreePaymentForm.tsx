import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export interface BraintreePaymentProps {
  bookingData: any;
  onComplete: (transactionId: string) => void;
  isDeposit: boolean;
  tipAmount?: number;
}

export function BraintreePaymentForm({ 
  bookingData, 
  onComplete, 
  isDeposit,
  tipAmount = 0
}: BraintreePaymentProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [braintreeInstance, setBraintreeInstance] = useState<any>(null);
  const [cardholderName, setCardholderName] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Calculate the payment amount based on whether it's a deposit or full payment
  const amount = isDeposit 
    ? Math.round(bookingData.amount * 0.25) 
    : (bookingData.paymentStatus === 'deposit_paid' 
        ? bookingData.amount - (bookingData.amount * 0.25) + tipAmount 
        : bookingData.amount + tipAmount);

  useEffect(() => {
    // Set mounted flag for client-side rendering
    setIsMounted(true);
    
    return () => {
      // Clean up Braintree instances
      if (braintreeInstance) {
        braintreeInstance.teardown();
      }
    };
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
    // Initialize Braintree
    const loadBraintree = async () => {
      try {
        setIsLoading(true);
        
        // Dynamically import Braintree libraries
        const braintree = await import('braintree-web-drop-in');
        
        // Make sure we have the client token
        if (!bookingData?.clientToken) {
          throw new Error('No client token available');
        }
        
        // Create the Braintree Drop-in UI
        const instance = await braintree.default.create({
          authorization: bookingData.clientToken,
          container: '#braintree-drop-in-container',
          paypal: {
            flow: 'vault'
          },
          card: {
            cardholderName: {
              required: true
            }
          }
        });
        
        setBraintreeInstance(instance);
        setIsLoading(false);
      } catch (error) {
        console.error('Braintree initialization error:', error);
        setErrorMessage('Failed to load payment form. Please try again.');
        setIsLoading(false);
        toast({
          title: 'Payment Error',
          description: 'Could not initialize payment form. Please refresh and try again.',
          variant: 'destructive'
        });
      }
    };
    
    loadBraintree();
  }, [isMounted, bookingData?.clientToken]);
  
  const handlePayment = async () => {
    if (!braintreeInstance) {
      setErrorMessage('Payment system is not ready. Please try again.');
      return;
    }
    
    try {
      setIsProcessing(true);
      
      // Request payment method from Braintree
      const { nonce } = await braintreeInstance.requestPaymentMethod();
      
      // Process the payment
      const response = await fetch('/api/braintree/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nonce,
          amount,
          bookingId: bookingData.id,
          cardholderName,
          isDeposit,
          tipAmount,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setIsSuccess(true);
        toast({
          title: 'Payment Successful',
          description: 'Your payment has been processed successfully.',
        });
        
        // Wait a moment before calling onComplete for better UX
        setTimeout(() => {
          onComplete(data.transaction.id);
        }, 1500);
      } else {
        setErrorMessage(data.message || 'Payment failed. Please try again.');
        toast({
          title: 'Payment Failed',
          description: data.message || 'Your payment could not be processed. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Payment processing error:', error);
      setErrorMessage(error.message || 'An error occurred while processing your payment.');
      toast({
        title: 'Payment Error',
        description: error.message || 'An error occurred while processing your payment.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (!isMounted) {
    return null; // Return nothing during SSR
  }
  
  if (isSuccess) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Payment Successful!</h3>
        <p className="text-muted-foreground mb-6">
          Your payment of {formatPrice(amount)} has been processed successfully.
        </p>
        <p className="text-sm text-muted-foreground">
          A confirmation email has been sent to your email address.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Payment Details</h3>
        <p className="text-sm text-muted-foreground">
          {isDeposit 
            ? 'Please pay the 25% deposit to secure your booking.' 
            : 'Please complete your payment to confirm your booking.'}
        </p>
      </div>
      
      <div className="bg-muted/30 p-4 rounded-md mb-6">
        <div className="flex justify-between mb-2">
          <span>{bookingData?.name}</span>
          <span>{formatPrice(bookingData?.amount)}</span>
        </div>
        
        {isDeposit ? (
          <div className="flex justify-between font-medium border-t border-muted pt-2 mt-2">
            <span>Deposit (25%)</span>
            <span>{formatPrice(amount)}</span>
          </div>
        ) : (
          <>
            {bookingData?.paymentStatus === 'deposit_paid' && (
              <div className="flex justify-between mb-2">
                <span>Deposit paid</span>
                <span>-{formatPrice(bookingData.amount * 0.25)}</span>
              </div>
            )}
            
            {tipAmount > 0 && (
              <div className="flex justify-between mb-2">
                <span>Tip</span>
                <span>{formatPrice(tipAmount)}</span>
              </div>
            )}
            
            <div className="flex justify-between font-medium border-t border-muted pt-2 mt-2">
              <span>Total due</span>
              <span>{formatPrice(amount)}</span>
            </div>
          </>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading payment form...</span>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cardholderName">Cardholder Name</Label>
              <Input 
                id="cardholderName"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                placeholder="Name as it appears on card"
                className="mt-1"
              />
            </div>
            
            <Card>
              <CardContent className="pt-6">
                <div id="braintree-drop-in-container" />
              </CardContent>
            </Card>
            
            {errorMessage && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
          
          <div className="pt-2">
            <Button
              onClick={handlePayment}
              disabled={isProcessing || !cardholderName}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Pay {formatPrice(amount)}
                </>
              )}
            </Button>
            
            <p className="text-sm text-center mt-4 text-muted-foreground">
              Your card will be securely processed by our payment provider.
            </p>
          </div>
        </>
      )}
    </div>
  );
}