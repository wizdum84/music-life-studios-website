import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, getBookingPaymentStatus } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, CreditCard, DollarSign } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { BraintreePaymentForm } from "@/components/forms/BraintreePaymentForm";

// Form schema for searching a booking
const searchSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  email: z.string().email("Please enter a valid email address")
});

type SearchFormValues = z.infer<typeof searchSchema>;

// Form schema for tip amount
const tipSchema = z.object({
  tipAmount: z.preprocess(
    (value) => (value === "" ? 0 : Number(value)),
    z.number().min(0, "Tip cannot be negative")
  )
});

type TipFormValues = z.infer<typeof tipSchema>;

export default function CompletePayment() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [clientToken, setClientToken] = useState("");
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [tipAmount, setTipAmount] = useState(0);
  const [step, setStep] = useState<"search" | "tip" | "payment" | "complete">("search");
  
  // Form setup for search
  const searchForm = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      bookingId: "",
      email: ""
    }
  });
  
  // Form setup for tip
  const tipForm = useForm<TipFormValues>({
    resolver: zodResolver(tipSchema),
    defaultValues: {
      tipAmount: 0
    }
  });
  
  // Parse URL parameters on component mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const email = params.get("email");
    
    if (id && email) {
      searchForm.setValue("bookingId", id);
      searchForm.setValue("email", email);
      handleSearch({ bookingId: id, email });
    }
  }, []);
  
  // Handle booking search
  const handleSearch = async (data: SearchFormValues) => {
    setIsLoading(true);
    try {
      const response = await getBookingPaymentStatus(data.bookingId, data.email);
      
      if (response.booking) {
        setBooking(response.booking);
        setClientToken(response.clientToken);
        setRemainingAmount(response.remainingAmount);
        
        // If booking is already fully paid
        if (response.booking.paymentStatus === 'paid') {
          toast({
            title: "Already Paid",
            description: "This booking has already been paid in full.",
            variant: "default"
          });
          setStep("complete");
        } else {
          setStep("tip");
        }
      }
    } catch (error: any) {
      console.error("Error fetching booking:", error);
      toast({
        title: "Booking Not Found",
        description: "We couldn't find a booking with those details. Please check and try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle tip submission
  const handleTipSubmit = (data: TipFormValues) => {
    setTipAmount(data.tipAmount);
    setStep("payment");
  };
  
  // Handle payment completion
  const handlePaymentComplete = (transactionId: string) => {
    // Update booking payment status with transaction info and tip
    apiRequest("POST", `/api/bookings/${booking.id}/update-payment`, {
      transactionId: transactionId,
      paymentStatus: "paid",
      tipAmount: tipAmount,
      totalPaid: remainingAmount + tipAmount
    }).then(() => {
      setStep("complete");
      toast({
        title: "Payment Complete",
        description: "Thank you for completing your payment.",
        variant: "default"
      });
    }).catch(error => {
      console.error("Error updating payment status:", error);
      toast({
        title: "Error",
        description: "There was an error recording your payment. Please contact support.",
        variant: "destructive"
      });
    });
  };
  
  // Render the search step
  const renderSearchStep = () => (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Complete Your Payment</CardTitle>
        <CardDescription>
          Enter your booking details to complete your payment and add a tip.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...searchForm}>
          <form onSubmit={searchForm.handleSubmit(handleSearch)} className="space-y-4">
            <FormField
              control={searchForm.control}
              name="bookingId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Booking ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your booking ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={searchForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your email address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                "Find My Booking"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
  
  // Render the tip step
  const renderTipStep = () => (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Add a Tip</CardTitle>
        <CardDescription>
          Your session is complete! Add a tip to show your appreciation (optional).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 space-y-2">
          <div className="flex justify-between">
            <span>Service:</span>
            <span className="font-medium">{booking?.name}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span className="font-medium">
              {new Date(booking?.date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Remaining Balance:</span>
            <span className="font-medium">{formatPrice(remainingAmount)}</span>
          </div>
        </div>
        
        <Form {...tipForm}>
          <form onSubmit={tipForm.handleSubmit(handleTipSubmit)} className="space-y-4">
            <div className="mb-6">
              <h3 className="font-medium mb-3">Add a Tip</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Show your appreciation for the service by adding a tip. Select a preset percentage or enter a custom amount.
              </p>
              
              <div className="grid grid-cols-4 gap-2 mb-4">
                <Button 
                  variant={tipAmount === 0 ? "default" : "outline"} 
                  size="sm" 
                  type="button"
                  onClick={() => {
                    tipForm.setValue("tipAmount", 0);
                    setTipAmount(0);
                  }}
                  className="text-xs py-1 h-auto"
                >
                  No Tip
                </Button>
                <Button 
                  variant={tipAmount === Math.round(remainingAmount * 0.10) ? "default" : "outline"} 
                  size="sm" 
                  type="button"
                  onClick={() => {
                    const tip10 = Math.round(remainingAmount * 0.10);
                    tipForm.setValue("tipAmount", tip10);
                    setTipAmount(tip10);
                  }}
                  className="text-xs py-1 h-auto"
                >
                  <span>10%</span>
                  <span className="text-xs text-muted-foreground">{formatPrice(remainingAmount * 0.10)}</span>
                </Button>
                <Button 
                  variant={tipAmount === Math.round(remainingAmount * 0.15) ? "default" : "outline"} 
                  size="sm" 
                  type="button"
                  onClick={() => {
                    const tip15 = Math.round(remainingAmount * 0.15);
                    tipForm.setValue("tipAmount", tip15);
                    setTipAmount(tip15);
                  }}
                  className="text-xs py-1 h-auto flex flex-col items-center justify-center"
                >
                  <span>15%</span>
                  <span className="text-xs text-muted-foreground">{formatPrice(remainingAmount * 0.15)}</span>
                </Button>
                <Button 
                  variant={tipAmount === Math.round(remainingAmount * 0.20) ? "default" : "outline"} 
                  size="sm" 
                  type="button"
                  onClick={() => {
                    const tip20 = Math.round(remainingAmount * 0.20);
                    tipForm.setValue("tipAmount", tip20);
                    setTipAmount(tip20);
                  }}
                  className="text-xs py-1 h-auto flex flex-col items-center justify-center"
                >
                  <span>20%</span>
                  <span className="text-xs text-muted-foreground">{formatPrice(remainingAmount * 0.20)}</span>
                </Button>
              </div>
              
              <FormField
                control={tipForm.control}
                name="tipAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Tip Amount</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                        <Input 
                          type="number" 
                          min={0} 
                          step="0.01"
                          className="pl-8" 
                          placeholder="Enter custom tip amount"
                          {...field}
                          onChange={(e) => {
                            // Convert to cents when saving to form state
                            const value = e.target.value === "" ? 0 : parseFloat(e.target.value) * 100;
                            field.onChange(value);
                            setTipAmount(Math.round(value));
                          }}
                          value={field.value ? (field.value / 100).toFixed(2) : ""}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-between pt-4 border-t border-border font-medium">
              <span>Total to pay:</span>
              <span>{formatPrice(remainingAmount + tipAmount)}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4">
              <Button 
                type="submit" 
                variant="outline"
                onClick={() => {
                  tipForm.setValue("tipAmount", 0);
                  tipForm.handleSubmit(handleTipSubmit)();
                }}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Skip Tip
              </Button>
              <Button 
                type="submit" 
                disabled={tipForm.formState.isSubmitting}
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Continue
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
  
  // Render the payment step
  const renderPaymentStep = () => (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Complete Payment</CardTitle>
        <CardDescription>
          Complete your payment for the remaining balance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 space-y-2">
          <div className="flex justify-between">
            <span>Remaining Balance:</span>
            <span className="font-medium">{formatPrice(remainingAmount)}</span>
          </div>
          
          {tipAmount > 0 && (
            <div className="flex justify-between">
              <span>Tip:</span>
              <span className="font-medium">{formatPrice(tipAmount)}</span>
            </div>
          )}
          
          <div className="flex justify-between pt-2 border-t font-medium">
            <span>Total Due:</span>
            <span>{formatPrice(remainingAmount + tipAmount)}</span>
          </div>
        </div>
        
        {/* Payment Form */}
        <BraintreePaymentForm
          bookingData={{
            ...booking,
            amount: remainingAmount
          }}
          onComplete={handlePaymentComplete}
          isDeposit={false}
          tipAmount={tipAmount}
        />
      </CardContent>
    </Card>
  );
  
  // Render the completion step
  const renderCompleteStep = () => (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <CardTitle className="text-center mt-4">Payment Complete!</CardTitle>
        <CardDescription className="text-center">
          Thank you for your payment. Your booking is now fully paid.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between">
          <span>Service:</span>
          <span className="font-medium">{booking?.name}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span className="font-medium">
            {booking?.date && new Date(booking.date).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
        </div>
        {tipAmount > 0 && (
          <div className="flex justify-between">
            <span>Tip:</span>
            <span className="font-medium">{formatPrice(tipAmount)}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button onClick={() => setLocation("/")}>Return to Homepage</Button>
      </CardFooter>
    </Card>
  );
  
  // Conditional rendering based on step
  return (
    <div className="container max-w-4xl py-12">
      <h1 className="text-3xl font-bold text-center mb-8">Complete Your Booking Payment</h1>
      
      {step === "search" && renderSearchStep()}
      {step === "tip" && booking && renderTipStep()}
      {step === "payment" && booking && renderPaymentStep()}
      {step === "complete" && booking && renderCompleteStep()}
    </div>
  );
}