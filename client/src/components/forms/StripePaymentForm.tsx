import { useEffect, useState, type FormEvent } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { formatPrice } from "@/lib/utils";

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

export interface StripePaymentProps {
  bookingData: { id?: number; amount: number; paymentStatus?: string };
  onComplete: (transactionId: string) => void;
  isDeposit: boolean;
  tipAmount?: number;
}

function PaymentForm({
  bookingData,
  onComplete,
  isDeposit,
  tipAmount,
  amountCents,
}: StripePaymentProps & { amountCents: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handlePayment = async (event: FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements || !bookingData.id) return;

    setIsProcessing(true);
    setErrorMessage("");
    try {
      const result = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (result.error) throw new Error(result.error.message || "Payment could not be completed");
      if (!result.paymentIntent || result.paymentIntent.status !== "succeeded") {
        throw new Error("Payment is still processing. Please check your booking before trying again.");
      }

      await apiRequest("POST", "/api/stripe/complete-payment", {
        paymentIntentId: result.paymentIntent.id,
      });
      toast({ title: "Payment successful", description: "Your payment has been verified and recorded." });
      onComplete(result.paymentIntent.id);
    } catch (error: any) {
      const message = error.message || "There was an error processing your payment.";
      setErrorMessage(message);
      toast({ title: "Payment failed", description: message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handlePayment} className="space-y-5">
      <PaymentElement />
      {errorMessage && (
        <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      <Button type="submit" className="w-full" disabled={isProcessing || !stripe || !elements}>
        {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : `Pay ${formatPrice(amountCents)}`}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Secure payment powered by Stripe. {isDeposit ? "A 50% deposit secures your booking." : "Your payment will be verified before the booking is marked paid."}
      </p>
    </form>
  );
}

export function StripePaymentForm({ bookingData, onComplete, isDeposit, tipAmount = 0 }: StripePaymentProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amountCents, setAmountCents] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!bookingData.id) {
      setErrorMessage("Your booking could not be initialized for payment.");
      return;
    }
    apiRequest("POST", "/api/stripe/create-payment-intent", {
      bookingId: bookingData.id,
      isDeposit,
      tipAmount,
    })
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) {
          setClientSecret(data.clientSecret);
          setAmountCents(data.amountCents);
        }
      })
      .catch((error: Error) => {
        if (!cancelled) setErrorMessage(error.message || "Unable to load Stripe checkout.");
      });
    return () => { cancelled = true; };
  }, [bookingData.id, isDeposit, tipAmount]);

  if (!publishableKey) {
    return <PaymentError message="Stripe checkout is not configured yet. Add VITE_STRIPE_PUBLISHABLE_KEY to the client environment." />;
  }
  if (errorMessage) return <PaymentError message={errorMessage} />;
  if (!clientSecret || !stripePromise) {
    return <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading secure checkout...</div>;
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
      <PaymentForm bookingData={bookingData} onComplete={onComplete} isDeposit={isDeposit} tipAmount={tipAmount} amountCents={amountCents} />
    </Elements>
  );
}

function PaymentError({ message }: { message: string }) {
  return <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-4 text-sm text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{message}</span></div>;
}
