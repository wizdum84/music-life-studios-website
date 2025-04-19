import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Check, CreditCard, DollarSign, Clock, FileText, ArrowLeft } from "lucide-react";
import { Service, TimeSlot, insertBookingSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Calendar from "@/components/calendar/Calendar";
import { formatPrice } from "@/lib/utils";
import { ContractRequirement } from "@/components/contracts";

interface BookingFormProps {
  services: Service[];
  timeSlots: TimeSlot[];
}

// Extend the insertBookingSchema for our form
const formSchema = insertBookingSchema.extend({
  timeSlotId: z.number().optional(),
});

type FormData = z.infer<typeof formSchema>;

export interface BraintreePaymentProps {
  bookingData: FormData | null;
  onComplete: (transactionId: string) => void;
  isDeposit: boolean;
  tipAmount?: number;
}

// This component will be replaced with a real Braintree integration
// once we have the API credentials
export function BraintreePaymentForm({ 
  bookingData, 
  onComplete,
  isDeposit,
  tipAmount = 0
}: BraintreePaymentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bookingData) {
      setMessage("No booking data available");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In production, this would be replaced with a real API call
      // to process payment with Braintree and get a nonce
      const mockTransactionId = `tr_${Math.random().toString(36).substring(2, 10)}`;
      
      toast({
        title: "Payment Successful",
        description: isDeposit 
          ? "Your deposit has been processed. Your booking is confirmed!" 
          : "Your payment has been processed. Your booking is confirmed!",
      });
      
      onComplete(mockTransactionId);
    } catch (error: any) {
      setMessage(error.message || "An unexpected error occurred.");
      toast({
        title: "Payment Failed",
        description: error.message || "Payment processing failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const paymentAmount = isDeposit
    ? (bookingData?.amount || 0) * 0.25
    : (bookingData?.amount || 0) + (tipAmount || 0);
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-muted rounded-md mb-4">
        <div className="text-sm text-muted-foreground mb-3">
          {isDeposit
            ? "Pay a 25% deposit now to secure your booking. The remaining balance will be due at the session."
            : "Pay the full amount now. You can also add a tip after your session."
          }
        </div>
        
        <div className="mb-4">
          <h4 className="font-medium mb-2">Payment Summary</h4>
          
          <div className="flex justify-between mb-2">
            <span>{bookingData?.name}</span>
            <span>{formatPrice(bookingData?.amount || 0)}</span>
          </div>
          
          {tipAmount > 0 && (
            <div className="flex justify-between mb-2">
              <span>Tip</span>
              <span>{formatPrice(tipAmount)}</span>
            </div>
          )}
          
          {isDeposit && (
            <div className="flex justify-between mb-2">
              <span>Deposit (25%)</span>
              <span>{formatPrice((bookingData?.amount || 0) * 0.25)}</span>
            </div>
          )}
          
          <div className="flex justify-between font-bold border-t border-border pt-2 mt-2">
            <span>Total Due Now</span>
            <span>{formatPrice(paymentAmount)}</span>
          </div>
        </div>
        
        {/* Placeholder for Braintree Drop-in UI */}
        <div className="bg-background border border-input rounded-md p-4 mb-3">
          <div className="mb-4">
            <label className="text-sm font-medium mb-1 block">Card Number</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border border-input rounded-md" 
              placeholder="4111 1111 1111 1111" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Expiration</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-input rounded-md" 
                placeholder="MM/YY" 
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">CVV</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-input rounded-md" 
                placeholder="123" 
              />
            </div>
          </div>
        </div>
      </div>
      
      {message && <p className="text-red-500 text-sm">{message}</p>}
      
      <Button 
        type="submit"
        disabled={isLoading} 
        className="w-full bg-primary hover:bg-primary/90"
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <CreditCard className="mr-2 h-4 w-4" />
        )}
        {isDeposit ? `Pay Deposit (${formatPrice((bookingData?.amount || 0) * 0.25)})` : `Pay Full Amount (${formatPrice(paymentAmount)})`}
      </Button>
    </form>
  );
}

export default function BookingForm({ services, timeSlots }: BookingFormProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<TimeSlot | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [availableTimes, setAvailableTimes] = useState<TimeSlot[]>([]);
  const [isContractStep, setIsContractStep] = useState(false);
  const [contractSigned, setContractSigned] = useState(false);
  const [isPaymentStep, setIsPaymentStep] = useState(false);
  const [paymentOption, setPaymentOption] = useState<'deposit' | 'full'>('deposit');
  const [tipAmount, setTipAmount] = useState(0);
  const [bookingData, setBookingData] = useState<FormData | null>(null);
  const [bookingComplete, setBookingComplete] = useState(false);
  
  const { toast } = useToast();
  
  // Form setup
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceId: undefined,
      name: "",
      email: "",
      date: "",
      duration: 120, // 2 hours default
      details: "",
      amount: 0
    },
  });
  
  // Update available times when date changes
  useEffect(() => {
    if (selectedDate) {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      const timesForDay = timeSlots.filter(slot => {
        const slotDate = new Date(slot.date);
        return (
          slot.available && 
          slotDate >= startOfDay && 
          slotDate <= endOfDay
        );
      });
      
      setAvailableTimes(timesForDay);
    } else {
      setAvailableTimes([]);
    }
  }, [selectedDate, timeSlots]);
  
  // Update form when service changes
  useEffect(() => {
    if (selectedServiceId) {
      const service = services.find(s => s.id === selectedServiceId);
      if (service) {
        const durationMinutes = selectedDuration || 120; // Default to 2 hours
        const hours = durationMinutes / 60;
        const amount = service.price * hours;
        
        form.setValue("serviceId", service.id);
        form.setValue("amount", amount);
      }
    }
  }, [selectedServiceId, selectedDuration, services, form]);
  
  // Selected service accessor
  const selectedService = selectedServiceId 
    ? services.find(s => s.id === selectedServiceId) 
    : null;
  
  // Handle service selection
  const handleServiceChange = (value: string) => {
    const serviceId = parseInt(value);
    setSelectedServiceId(serviceId);
  };
  
  // Handle duration selection
  const handleDurationChange = (value: string) => {
    const duration = parseInt(value);
    setSelectedDuration(duration);
    form.setValue("duration", duration);
  };
  
  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };
  
  // Handle time selection
  const handleTimeSelect = (timeSlot: TimeSlot) => {
    setSelectedTime(timeSlot);
    form.setValue("date", new Date(timeSlot.date).toISOString());
    form.setValue("timeSlotId", timeSlot.id);
  };
  
  // Calculate total price
  const calculateTotal = () => {
    if (!selectedService || !selectedDuration) return 0;
    const hours = selectedDuration / 60;
    return selectedService.price * hours / 100;
  };
  
  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  // Format time for display
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };
  
  const handlePaymentComplete = (transactionId: string) => {
    // Process the booking with payment information
    apiRequest("POST", "/api/bookings", {
      ...bookingData,
      transactionId,
      paymentStatus: paymentOption === 'deposit' ? 'deposit_paid' : 'paid',
      status: 'confirmed',
      tipAmount: paymentOption === 'full' ? tipAmount : 0 // Include tip amount in booking data
    }).then(() => {
      setBookingComplete(true);
      
      // Reset tip amount if needed
      if (tipAmount > 0) {
        setTipAmount(0);
      }
    }).catch(error => {
      console.error("Error finalizing booking:", error);
      toast({
        title: "Error",
        description: "There was an error finalizing your booking. Please contact support.",
        variant: "destructive"
      });
    });
  };
  
  // Contract signing complete handler
  const handleContractSigned = () => {
    setContractSigned(true);
    // Move to payment step
    setIsContractStep(false);
    setIsPaymentStep(true);
  };
  
  // Form submission
  const onSubmit = async (data: FormData) => {
    try {
      // Store booking data for later submission after payment
      setBookingData(data);
      
      // Move to contract step first
      setIsContractStep(true);
    } catch (error) {
      console.error("Error creating booking:", error);
      toast({
        title: "Error",
        description: "Failed to process your booking. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // If booking is complete, show confirmation
  if (bookingComplete) {
    return (
      <div className="text-center py-8">
        <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Booking Confirmed!</h3>
        <p className="text-muted-foreground mb-6">
          Thank you for your booking. We'll see you soon!
        </p>
        <Button asChild className="bg-primary hover:bg-primary-600">
          <a href="/">Return to Homepage</a>
        </Button>
      </div>
    );
  }
  
  // If we're at the contract step, show contract requirements
  if (isContractStep) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium text-xl">Studio Rules & Agreement</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsContractStep(false)}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>
        
        {/* Summary Card */}
        <Card className="bg-muted/30">
          <CardHeader className="pb-3">
            <CardTitle>Booking Summary</CardTitle>
            <CardDescription>
              {selectedService?.name} • {selectedDuration && `${selectedDuration / 60} hours`} • {selectedDate && formatDate(selectedDate)}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Service Rate</span>
                <span>{formatPrice(selectedService?.price || 0)}/hr</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Duration</span>
                <span>{selectedDuration && `${selectedDuration / 60} hours`}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t font-medium">
                <span>Total Amount</span>
                <span>{formatPrice((bookingData?.amount || 0))}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="bg-background border rounded-lg p-1">
          {/* Studio Rules Contract Component */}
          <ContractRequirement
            contractId={4} // Studio Rules Contract ID
            entityType="booking"
            entityId={undefined} // Will be set after booking is created
            email={bookingData?.email || ""}
            name={bookingData?.name || ""}
            onContractSigned={handleContractSigned}
            onCheckExistingSignature={false}
          />
        </div>
      </div>
    );
  }
  
  // If we're at the payment step, show the payment options and form
  if (isPaymentStep) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium text-xl">Payment Information</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => { 
              setIsPaymentStep(false);
              setIsContractStep(true);
            }}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>

        {/* Summary Card */}
        <Card className="bg-muted/30">
          <CardHeader className="pb-3">
            <CardTitle>Booking Summary</CardTitle>
            <CardDescription>
              {selectedService?.name} • {selectedDuration && `${selectedDuration / 60} hours`} • {selectedDate && formatDate(selectedDate)}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Service Rate</span>
                <span>{formatPrice(selectedService?.price || 0)}/hr</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Duration</span>
                <span>{selectedDuration && `${selectedDuration / 60} hours`}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t font-medium">
                <span>Total Amount</span>
                <span>{formatPrice((bookingData?.amount || 0))}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Payment Options */}
        <div className="my-6">
          <h4 className="font-medium mb-4">Choose Payment Option</h4>
          <Tabs defaultValue="deposit" onValueChange={(val) => setPaymentOption(val as 'deposit' | 'full')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="deposit" className="flex gap-2 items-center">
                <Clock className="h-4 w-4" />
                Pay Deposit (25%)
              </TabsTrigger>
              <TabsTrigger value="full" className="flex gap-2 items-center">
                <DollarSign className="h-4 w-4" />
                Pay Full Amount
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="deposit">
              <p className="text-sm text-muted-foreground mb-4">
                Pay 25% now to secure your booking. The remaining balance will be due at the session.
              </p>
              <div className="font-medium flex justify-between">
                <span>Deposit Due Now:</span>
                <span>{formatPrice((bookingData?.amount || 0) * 0.25)}</span>
              </div>
            </TabsContent>
            
            <TabsContent value="full">
              <p className="text-sm text-muted-foreground mb-4">
                Pay the full amount now for your convenience.
              </p>
              
              {/* Tip options for full payment */}
              <div className="mb-4 p-4 border border-dashed border-border rounded-md bg-muted/30">
                <h5 className="text-sm font-medium mb-3">Would you like to add a tip?</h5>
                
                <div className="grid grid-cols-4 gap-2 mb-3">
                  <Button 
                    variant={tipAmount === 0 ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => setTipAmount(0)}
                    className="text-xs py-1 h-auto"
                  >
                    No Tip
                  </Button>
                  <Button 
                    variant={tipAmount === Math.round((bookingData?.amount || 0) * 0.10) ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => setTipAmount(Math.round((bookingData?.amount || 0) * 0.10))}
                    className="text-xs py-1 h-auto"
                  >
                    10% ({formatPrice((bookingData?.amount || 0) * 0.10)})
                  </Button>
                  <Button 
                    variant={tipAmount === Math.round((bookingData?.amount || 0) * 0.15) ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => setTipAmount(Math.round((bookingData?.amount || 0) * 0.15))}
                    className="text-xs py-1 h-auto"
                  >
                    15% ({formatPrice((bookingData?.amount || 0) * 0.15)})
                  </Button>
                  <Button 
                    variant={tipAmount === Math.round((bookingData?.amount || 0) * 0.20) ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => setTipAmount(Math.round((bookingData?.amount || 0) * 0.20))}
                    className="text-xs py-1 h-auto"
                  >
                    20% ({formatPrice((bookingData?.amount || 0) * 0.20)})
                  </Button>
                </div>
                
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                  <Input
                    type="number"
                    placeholder="Custom amount"
                    min="0"
                    step="0.01"
                    className="pl-8 text-sm"
                    value={tipAmount > 0 ? (tipAmount / 100).toFixed(2) : ""}
                    onChange={(e) => {
                      const value = e.target.value === "" ? 0 : parseFloat(e.target.value) * 100;
                      setTipAmount(Math.round(value));
                    }}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Service Total:</span>
                  <span>{formatPrice(bookingData?.amount || 0)}</span>
                </div>
                
                {tipAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Tip:</span>
                    <span>{formatPrice(tipAmount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between font-medium pt-2 border-t border-border">
                  <span>Total Due Now:</span>
                  <span>{formatPrice((bookingData?.amount || 0) + tipAmount)}</span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Braintree Payment Form */}
        <BraintreePaymentForm
          bookingData={bookingData}
          onComplete={handlePaymentComplete}
          isDeposit={paymentOption === 'deposit'}
          tipAmount={paymentOption === 'full' ? tipAmount : 0}
        />

        {/* Return Later Option */}
        {paymentOption === 'deposit' && (
          <p className="text-center text-sm text-muted-foreground mt-6">
            After your session, you'll receive an email with a link to pay the remaining balance and add a tip if you'd like.
          </p>
        )}
      </div>
    );
  }
  
  // Initial booking form
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="serviceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service Type</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(parseInt(value));
                    handleServiceChange(value);
                  }}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {services.map(service => (
                      <SelectItem key={service.id} value={service.id.toString()}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Session Length</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(parseInt(value));
                    handleDurationChange(value);
                  }}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="120">2 Hours</SelectItem>
                    <SelectItem value="240">4 Hours</SelectItem>
                    <SelectItem value="480">8 Hours (Full Day)</SelectItem>
                    <SelectItem value="60">1 Hour (Custom)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="mb-6">
          <FormLabel>Select Date & Time</FormLabel>
          <div className="bg-muted p-4 rounded-md">
            {/* Calendar Component */}
            <Calendar 
              onDateSelect={handleDateSelect} 
              selectedDate={selectedDate} 
              availableDates={timeSlots.map(slot => new Date(slot.date))}
            />
            
            {/* Time Slots */}
            {selectedDate && (
              <div className="mt-4">
                <h5 className="font-medium mb-2">
                  Available Time Slots for {formatDate(selectedDate)}
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {availableTimes.length > 0 ? (
                    availableTimes.map(slot => (
                      <div 
                        key={slot.id}
                        className={`p-2 border rounded text-center cursor-pointer transition-colors ${
                          selectedTime?.id === slot.id
                            ? 'border-primary bg-primary/10 text-primary font-medium'
                            : 'border-muted-foreground/20 hover:bg-primary/10'
                        }`}
                        onClick={() => handleTimeSelect(slot)}
                      >
                        {formatTime(new Date(slot.date))}
                      </div>
                    ))
                  ) : (
                    <p className="col-span-full text-center text-muted-foreground">
                      No available times for this date.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          {form.formState.errors.date && (
            <p className="text-red-500 text-sm mt-1">{form.formState.errors.date.message}</p>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input placeholder="your@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="details"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Details</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Tell me about your project and any specific requirements" 
                  className="resize-none" 
                  rows={4}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {selectedService && selectedTime && selectedDuration && (
          <div className="mb-6 bg-muted/30 p-4 rounded-md">
            <h4 className="font-medium mb-2">Payment Summary</h4>
            
            <div className="flex justify-between mb-2">
              <span>{selectedService.name} ({formatTime(new Date(selectedTime.date))}, {formatDate(selectedDate!)})</span>
              <span>${selectedService.price / 100}/hour</span>
            </div>
            
            <div className="flex justify-between mb-2">
              <span>Duration</span>
              <span>{selectedDuration / 60} hours</span>
            </div>
            
            <div className="flex justify-between font-medium border-t border-muted pt-2 mt-2">
              <span>Total</span>
              <span>${calculateTotal().toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between text-sm mt-1">
              <span>Deposit (25%)</span>
              <span>${(calculateTotal() * 0.25).toFixed(2)}</span>
            </div>
          </div>
        )}
        
        <div className="mb-6">
          <h4 className="font-medium mb-2">Payment Method</h4>
          <RadioGroup defaultValue="card" className="flex flex-wrap gap-4">
            <div className="flex items-center p-3 border border-muted-foreground/20 rounded-md cursor-pointer hover:bg-muted transition-colors">
              <RadioGroupItem value="card" id="payment-card" className="mr-2" />
              <label htmlFor="payment-card" className="flex items-center cursor-pointer">
                <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2 text-blue-600" fill="currentColor">
                  <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                </svg>
                <span>Credit/Debit Card</span>
              </label>
            </div>
            
            <div className="flex items-center p-3 border border-muted-foreground/20 rounded-md cursor-pointer hover:bg-muted transition-colors opacity-50">
              <RadioGroupItem value="paypal" id="payment-paypal" className="mr-2" disabled />
              <label htmlFor="payment-paypal" className="flex items-center cursor-not-allowed">
                <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2 text-blue-800" fill="currentColor">
                  <path d="M9.91 13.07H7.58L7.15 15.67H4.5L6.13 5.67H10.13C12.43 5.67 13.42 6.77 13.42 8.4C13.41 11.34 11.95 13.07 9.91 13.07zM9.66 7.67H8.55L7.92 11.07H9.06C10.26 11.07 10.9 10.09 10.9 8.9C10.9 8.03 10.45 7.67 9.66 7.67z"/>
                  <path d="M19.5 12.4h-3.88l-0.5 3.27H12.5L14.12 5.67H18.13c2.3 0 3.29 1.1 3.29 2.73C21.41 11.34 19.94 12.4 19.5 12.4zM18.24 7.67H17.13L16.37 10.4H17.5c1.21 0 1.85-0.48 1.85-1.67C19.35 8.03 18.9 7.67 18.24 7.67z"/>
                </svg>
                <span>PayPal (Coming Soon)</span>
              </label>
            </div>
          </RadioGroup>
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-primary hover:bg-primary-600 py-6 text-base"
          disabled={
            !selectedService || 
            !selectedTime || 
            !selectedDuration || 
            form.formState.isSubmitting
          }
        >
          {form.formState.isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Proceed to Payment"
          )}
        </Button>
        
        <p className="text-sm text-center mt-2 text-muted-foreground">
          A 25% deposit is required to secure your booking.
        </p>
      </form>
    </Form>
  );
}
