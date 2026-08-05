import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { TimeSlot, Service } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { formatPrice, scrollToTop } from "@/lib/utils";

// UI Components
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Check, ArrowLeft, Clock, DollarSign } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Icons
import {
  FileText,
  Loader2,
} from "lucide-react";

import { ContractRequirement } from "../contracts/ContractRequirement";
import { BraintreePaymentForm } from "@/components/forms/BraintreePaymentForm";

// Form schema
const formSchema = z.object({
  serviceId: z.number({
    required_error: "Please select a service",
  }),
  name: z.string().min(2, {
    message: "Name must be at least 2 characters",
  }),
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
  phone: z.string().optional(),
  date: z.string({
    required_error: "Please select a date and time",
  }),
  timeSlotId: z.number({
    required_error: "Please select a time slot",
  }),
  duration: z.number({
    required_error: "Please select a duration",
  }),
  details: z.string().optional(),
  amount: z.number(),
});

type FormData = z.infer<typeof formSchema>;

interface BookingFormProps {
  services: Service[];
  timeSlots: TimeSlot[];
  preselectedServiceId?: number | null;
  serviceType?: 'recording' | 'mixing' | 'production' | null;
}

export default function BookingForm({ 
  services, 
  timeSlots, 
  preselectedServiceId = null,
  serviceType = null
}: BookingFormProps) {
  // State machine for the booking process
  const [currentStep, setCurrentStep] = useState<'form' | 'contract' | 'payment' | 'confirmation'>('form');
  
  // Form data state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<TimeSlot | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(preselectedServiceId);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [availableTimes, setAvailableTimes] = useState<TimeSlot[]>([]);
  const [bookingData, setBookingData] = useState<FormData | null>(null);
  
  // Service type flags
  const isMixingService = serviceType === 'mixing' || 
    (selectedServiceId && services.some(s => 
      s.id === selectedServiceId && 
      (s.name.toLowerCase().includes('mixing') || s.name.toLowerCase().includes('mastering'))
    ));
    
  const isRecordingService = serviceType === 'recording' || 
    (selectedServiceId && services.some(s => 
      s.id === selectedServiceId && 
      (s.name.toLowerCase().includes('recording') || s.name.toLowerCase().includes('session'))
    ));

  const isProductionService = serviceType === 'production' ||
    (selectedServiceId && services.some(s =>
      s.id === selectedServiceId &&
      (s.name.toLowerCase().includes('producer') || s.name.toLowerCase().includes('production') || s.name.toLowerCase().includes('composition'))
    ));
  
  // Payment state
  const [contractSigned, setContractSigned] = useState(false);
  const [paymentOption, setPaymentOption] = useState<'deposit' | 'full'>('deposit');
  const [tipAmount, setTipAmount] = useState(0);
  const [bookingComplete, setBookingComplete] = useState(false);
  
  const { toast } = useToast();
  
  // Form setup
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceId: undefined,
      name: "",
      email: "",
      phone: "",
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
        console.log(`Service selected: ${service.name} (ID: ${service.id})`);
        
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
    
    // Debug service selection
    const service = services.find(s => s.id === serviceId);
    console.log(`Service changed to: ${service?.name} (ID: ${serviceId})`);
    console.log(`Recording service? ${service?.name.toLowerCase().includes('recording') || service?.name.toLowerCase().includes('session')}`);
    
    // Scroll to top
    scrollToTop();
  };
  
  // Handle duration selection
  const handleDurationChange = (value: string) => {
    const duration = parseInt(value);
    setSelectedDuration(duration);
    form.setValue("duration", duration);
    
    // Scroll to top
    scrollToTop();
  };
  
  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    
    // Scroll to top
    scrollToTop();
  };
  
  // Handle time slot selection
  const handleTimeSelect = (timeSlot: TimeSlot) => {
    setSelectedTime(timeSlot);
    form.setValue("timeSlotId", timeSlot.id);
    
    // Scroll to top
    scrollToTop();
  };
  
  // Handle date selection for services that can start with a project date instead of a fixed studio slot.
  useEffect(() => {
    if (selectedDate && (isMixingService || isRecordingService || isProductionService)) {
      // Scroll to top
      scrollToTop();
      
      // Use a placeholder time slot ID that will be handled differently on the server
      form.setValue("timeSlotId", -1);
      
      // Format the date with noon time to make a complete ISO string
      const dateWithNoon = new Date(selectedDate);
      dateWithNoon.setHours(12, 0, 0, 0);
      
      form.setValue("date", dateWithNoon.toISOString());
      
      console.log(`Date set for ${isRecordingService ? "recording" : isProductionService ? "production" : "mixing"} service: ${dateWithNoon.toISOString()}`);
    }
  }, [isMixingService, isRecordingService, isProductionService, selectedDate, form]);
  
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
  
  // Contract signing handler
  const handleContractSigned = () => {
    setContractSigned(true);
    setCurrentStep('payment');
    
    // Scroll to top
    scrollToTop();
  };
  
  // Form submission
  const onSubmit = (data: FormData) => {
    console.log("Form submitted with data:", data);
    setBookingData(data);
    setCurrentStep('contract');
    // Scroll to top
    scrollToTop();
  };
  
  // Payment completion handler
  const handlePaymentComplete = (transactionId: string) => {
    // Process the booking with payment information
    apiRequest("POST", "/api/bookings", {
      ...bookingData,
      transactionId,
      paymentStatus: paymentOption === 'deposit' ? 'deposit_paid' : 'paid',
      status: 'confirmed',
    }).then(() => {
      // Scroll to top
      scrollToTop();
      
      // Reset tip amount if needed
      if (tipAmount > 0) {
        setTipAmount(0);
      }
      
      setCurrentStep('confirmation');
    }).catch(error => {
      console.error("Error finalizing booking:", error);
      toast({
        title: "Error",
        description: "There was an error finalizing your booking. Please contact support.",
        variant: "destructive"
      });
    });
  };
  
  console.log("Current step:", currentStep);
  
  // Render based on the current step
  if (currentStep === 'confirmation') {
    scrollToTop();
    return (
      <div className="text-center max-w-md mx-auto py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
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
  
  if (currentStep === 'contract' && bookingData) {
    // Determine which contract to show based on the service type
    let contractId = 1; // Default Studio Rules Contract ID
    let contractTitle = "Studio Rules & Agreement";
    
    // If service is mixing/mastering, use different contract
    if (isMixingService) {
      contractId = 2; // Use mixing/mastering contract
      contractTitle = "Mixing & Mastering Agreement";
    } 
    // For recording sessions, make sure we use the studio rules contract
    else if (isRecordingService) {
      contractId = 1; // Studio Rules Contract ID
      contractTitle = "Studio Rules & Agreement";
    }
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium text-xl">{contractTitle}</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setCurrentStep('form');
              scrollToTop();
            }}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Form
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
          <CardContent>
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
          <ContractRequirement
            contractId={contractId}
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
  
  if (currentStep === 'payment') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium text-xl">Payment Information</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setCurrentStep('contract');
              scrollToTop();
            }}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Agreement
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
          <CardContent>
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
                    onClick={() => {
                      setTipAmount(0);
                      scrollToTop();
                    }}
                    className="text-xs py-1 h-auto"
                  >
                    No Tip
                  </Button>
                  <Button 
                    variant={tipAmount === Math.round((bookingData?.amount || 0) * 0.10) ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => {
                      setTipAmount(Math.round((bookingData?.amount || 0) * 0.10));
                      scrollToTop();
                    }}
                    className="text-xs py-1 h-auto flex flex-col items-center justify-center"
                  >
                    <span>10%</span>
                    <span className="text-xs text-muted-foreground">{formatPrice((bookingData?.amount || 0) * 0.10)}</span>
                  </Button>
                  <Button 
                    variant={tipAmount === Math.round((bookingData?.amount || 0) * 0.15) ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => {
                      setTipAmount(Math.round((bookingData?.amount || 0) * 0.15));
                      scrollToTop();
                    }}
                    className="text-xs py-1 h-auto flex flex-col items-center justify-center"
                  >
                    <span>15%</span>
                    <span className="text-xs text-muted-foreground">{formatPrice((bookingData?.amount || 0) * 0.15)}</span>
                  </Button>
                  <Button 
                    variant={tipAmount === Math.round((bookingData?.amount || 0) * 0.20) ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => {
                      setTipAmount(Math.round((bookingData?.amount || 0) * 0.20));
                      scrollToTop();
                    }}
                    className="text-xs py-1 h-auto flex flex-col items-center justify-center"
                  >
                    <span>20%</span>
                    <span className="text-xs text-muted-foreground">{formatPrice((bookingData?.amount || 0) * 0.20)}</span>
                  </Button>
                </div>
                
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                  <Input
                    type="number"
                    className="pl-8"
                    placeholder="Custom amount"
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
                  <div className="flex justify-between text-sm">
                    <span>Tip Amount:</span>
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
          bookingData={bookingData!}
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
  
  // Default: Initial booking form
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
                    {selectedService && (selectedService.name.toLowerCase().includes("mixing") || 
                      selectedService.name.toLowerCase().includes("mastering")) ? (
                      <>
                        <SelectItem value="60">1 song</SelectItem>
                        <SelectItem value="120">2 songs</SelectItem>
                        <SelectItem value="180">3 songs</SelectItem>
                        <SelectItem value="240">4 songs</SelectItem>
                        <SelectItem value="300">5 songs</SelectItem>
                        <SelectItem value="360">EP (6 songs)</SelectItem>
                        <SelectItem value="480">Album (8-10 songs)</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                        <SelectItem value="180">3 hours</SelectItem>
                        <SelectItem value="240">4 hours</SelectItem>
                        <SelectItem value="300">5 hours</SelectItem>
                        <SelectItem value="360">6 hours</SelectItem>
                        <SelectItem value="420">7 hours</SelectItem>
                        <SelectItem value="480">8 hours</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Select Date</h4>
            <Calendar
              mode="single"
              selected={selectedDate || undefined}
              onSelect={(date) => {
                if (date) handleDateSelect(date);
              }}
              disabled={(date) => {
                // Can't select dates in the past
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                // Or dates more than 60 days in the future
                const maxDate = new Date();
                maxDate.setDate(maxDate.getDate() + 60);
                
                return date < today || date > maxDate;
              }}
              className="rounded-md border"
            />
          </div>
          
          {/* For mixing services - show estimated completion time */}
          {isMixingService && selectedDuration && (
            <div className="p-4 bg-muted/40 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Estimated Completion Time
              </h4>
              <p className="text-muted-foreground">
                {selectedDuration <= 180 
                  ? `${Math.ceil(selectedDuration / 60 * 2)} days` 
                  : selectedDuration <= 360 
                    ? "2-3 weeks" 
                    : "3-4 weeks"}
              </p>
              
              {/* Price breakdown */}
              <div className="mt-4 pt-4 border-t border-border">
                <h4 className="font-medium mb-2">Price Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>
                      {selectedDuration === 360 
                        ? "EP (6 songs)" 
                        : selectedDuration === 480 
                          ? "Album (8-10 songs)" 
                          : `${selectedDuration / 60} ${selectedDuration === 60 ? 'song' : 'songs'}`}
                    </span>
                    <span>{formatPrice(selectedService?.price || 0)}</span>
                  </div>
                  <div className="flex justify-between font-medium pt-2 border-t border-border">
                    <span>Total</span>
                    <span>{formatPrice(selectedDuration / 60 * (selectedService?.price || 0))}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>25% Deposit Required</span>
                    <span>{formatPrice(selectedDuration / 60 * (selectedService?.price || 0) * 0.25)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* For recording services - show time selection */}
          {selectedDate && isRecordingService && (
            <div>
              <h4 className="font-medium mb-2">Select Time</h4>
              {availableTimes.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {availableTimes.map((slot) => (
                    <Button
                      key={slot.id}
                      type="button"
                      variant={selectedTime?.id === slot.id ? "default" : "outline"}
                      className="h-auto py-3"
                      onClick={() => handleTimeSelect(slot)}
                    >
                      {formatTime(new Date(slot.date))}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No available time slots for this date. Please select another date.</p>
              )}
            </div>
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
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number <span className="text-muted-foreground text-xs">(optional)</span></FormLabel>
                <FormControl>
                  <Input placeholder="Your phone number" {...field} />
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
                  <Input placeholder="Your email" type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="details"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Details <span className="text-muted-foreground text-xs">(optional)</span></FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Please provide any additional details about your booking needs" 
                    className="min-h-[80px]" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Booking Summary */}
        {selectedService && selectedDuration && (
          <Card className="bg-muted/30">
            <CardHeader className="pb-3">
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Service</h4>
                    <p>{selectedService.name}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Duration</h4>
                    <p>
                      {selectedDuration / 60} {isMixingService 
                        ? (selectedDuration === 60 ? 'song' : 'songs') 
                        : (selectedDuration === 60 ? 'hour' : 'hours')
                      }
                    </p>
                  </div>
                  {selectedDate && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Date</h4>
                      <p>{formatDate(selectedDate)}</p>
                    </div>
                  )}
                  {selectedTime && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Time</h4>
                      <p>{formatTime(new Date(selectedTime.date))}</p>
                    </div>
                  )}
                </div>
                
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Payment Summary</h4>
                  
                  <div className="flex justify-between mb-2">
                    <span>
                      {selectedService.name} 
                      {isMixingService 
                        ? ` (${selectedDuration / 60} ${selectedDuration === 60 ? 'song' : 'songs'})` 
                        : ` (${selectedDuration / 60} ${selectedDuration === 60 ? 'hour' : 'hours'})`
                      }
                    </span>
                    <span>{formatPrice(selectedDuration / 60 * selectedService.price)}</span>
                  </div>
                  
                  <div className="flex justify-between mb-2 text-muted-foreground text-sm">
                    <span>Due Today (25% Deposit)</span>
                    <span>{formatPrice(selectedDuration / 60 * selectedService.price * 0.25)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Remaining Balance</span>
                    <span>{formatPrice(selectedDuration / 60 * selectedService.price * 0.75)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="flex justify-end">
          <Button 
            type="submit" 
            size="lg"
            disabled={Boolean(!selectedServiceId || !selectedDuration || (isRecordingService && !selectedTime && !selectedDate))}
          >
            Continue to Contract
          </Button>
        </div>
      </form>
    </Form>
  );
}
