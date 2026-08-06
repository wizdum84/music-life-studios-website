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
  const [recordingOption, setRecordingOption] = useState("hourly");
  const [mixOption, setMixOption] = useState("quick-finish");
  const [productionOption, setProductionOption] = useState("custom-beat");
  const [intakeDetails, setIntakeDetails] = useState({
    artistName: "",
    songTitle: "",
    numberOfArtists: "",
    estimatedSongs: "",
    genre: "",
    recordingType: "",
    performanceType: "",
    vocalists: "",
    instrumentalFormat: "",
    trackCount: "",
    fileFormat: "",
    deliverySpeed: "",
    mixStyle: "",
    correctionPreference: "",
    creativeEffects: "",
    soundDescription: "",
    referenceLink: "",
    referenceNotes: "",
    deliveryOptions: "",
    projectName: "",
    projectType: "",
    projectDescription: "",
    intendedUse: "",
    desiredStyle: "",
    estimatedLength: "",
    tracksNeeded: "",
    desiredDeadline: "",
    estimatedBudget: "",
    rightsNeeds: "",
    preferredContact: "",
  });
  
  // Service type flags
  const isMixingService = serviceType === 'mixing' || 
    (selectedServiceId && services.some(s => 
      s.id === selectedServiceId && 
      (s.name.toLowerCase().includes('mix') || s.name.toLowerCase().includes('master'))
    ));
    
  const isRecordingService = serviceType === 'recording' || 
    (selectedServiceId && services.some(s => 
      s.id === selectedServiceId && 
      (s.name.toLowerCase().includes('recording') || s.name.toLowerCase().includes('session') || s.name.toLowerCase().includes('record'))
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

  const updateIntake = (key: keyof typeof intakeDetails, value: string) => {
    setIntakeDetails((current) => ({ ...current, [key]: value }));
  };

  const getSongCount = () => Math.max(1, selectedDuration ? selectedDuration / 60 : 1);

  const getBookingPathLabel = () => {
    if (isRecordingService) return recordingOption === "release-ready" ? "Release-ready song package" : "Hourly recording session";
    if (isMixingService) {
      if (mixOption === "quick-finish") return "Quick Finish";
      if (mixOption === "master-only") return "Master Only";
      if (mixOption === "advanced") return "Advanced Mix and Master";
      return "Full Mix and Master";
    }
    if (isProductionService) {
      if (productionOption === "custom-beat") return "Custom beat production";
      if (productionOption === "build-song") return "Build-a-Song session";
      if (productionOption === "complete-single") return "Complete custom single";
      if (productionOption === "signature-single") return "Signature custom single";
      return "Custom media quote";
    }
    return "General booking";
  };

  const getQuantityLabel = () => {
    if (!selectedDuration) return "";
    if (isMixingService || recordingOption === "release-ready") {
      return `${getSongCount()} ${getSongCount() === 1 ? "song" : "songs"}`;
    }
    if (isProductionService) return "Project inquiry";
    return `${selectedDuration / 60} ${selectedDuration === 60 ? "hour" : "hours"}`;
  };

  const calculateAmountCents = () => {
    const units = selectedDuration ? selectedDuration / 60 : 0;
    if (!selectedService || !selectedDuration) return 0;

    if (isRecordingService) {
      if (recordingOption === "release-ready") return units * 22500;
      if (selectedDuration === 240) return 18000;
      return Math.max(2, units) * 5000;
    }

    if (isMixingService) {
      if (mixOption === "quick-finish") {
        const quickFinishPrices: Record<number, number> = {
          1: 7500,
          2: 14000,
          3: 20000,
          4: 25000,
          5: 30000,
        };
        return quickFinishPrices[units] ?? units * 7500;
      }
      if (mixOption === "master-only") return units * 5000;
      if (mixOption === "advanced") return units * 17500;
      return units * 12500;
    }

    if (isProductionService) {
      const productionPrices: Record<string, number> = {
        "custom-beat": 20000,
        "build-song": 25000,
        "complete-single": 32500,
        "signature-single": 45000,
        "media-quote": 0,
      };
      return productionPrices[productionOption] ?? selectedService.price;
    }

    return selectedService.price * units;
  };

  const buildStructuredDetails = (notes?: string) => {
    const lines = [
      `Service path: ${isRecordingService ? recordingOption : isMixingService ? mixOption : isProductionService ? productionOption : "general"}`,
      intakeDetails.artistName && `Artist name: ${intakeDetails.artistName}`,
      intakeDetails.songTitle && `Song title: ${intakeDetails.songTitle}`,
      intakeDetails.genre && `Genre: ${intakeDetails.genre}`,
      intakeDetails.numberOfArtists && `Number of artists attending: ${intakeDetails.numberOfArtists}`,
      intakeDetails.estimatedSongs && `Estimated songs: ${intakeDetails.estimatedSongs}`,
      intakeDetails.recordingType && `Recording type: ${intakeDetails.recordingType}`,
      intakeDetails.performanceType && `Performance type: ${intakeDetails.performanceType}`,
      intakeDetails.vocalists && `Number of vocalists: ${intakeDetails.vocalists}`,
      intakeDetails.instrumentalFormat && `Instrumental format: ${intakeDetails.instrumentalFormat}`,
      intakeDetails.trackCount && `Approximate audio tracks: ${intakeDetails.trackCount}`,
      intakeDetails.fileFormat && `Session/file format: ${intakeDetails.fileFormat}`,
      intakeDetails.deliverySpeed && `Delivery speed: ${intakeDetails.deliverySpeed}`,
      intakeDetails.mixStyle && `Mix style: ${intakeDetails.mixStyle}`,
      intakeDetails.correctionPreference && `Vocal correction: ${intakeDetails.correctionPreference}`,
      intakeDetails.creativeEffects && `Creative effects: ${intakeDetails.creativeEffects}`,
      intakeDetails.soundDescription && `Sound description: ${intakeDetails.soundDescription}`,
      intakeDetails.referenceLink && `Reference link: ${intakeDetails.referenceLink}`,
      intakeDetails.referenceNotes && `Reference notes: ${intakeDetails.referenceNotes}`,
      intakeDetails.deliveryOptions && `Delivery options: ${intakeDetails.deliveryOptions}`,
      intakeDetails.projectName && `Project/company name: ${intakeDetails.projectName}`,
      intakeDetails.projectType && `Project type: ${intakeDetails.projectType}`,
      intakeDetails.projectDescription && `Project description: ${intakeDetails.projectDescription}`,
      intakeDetails.intendedUse && `Intended use: ${intakeDetails.intendedUse}`,
      intakeDetails.desiredStyle && `Desired style: ${intakeDetails.desiredStyle}`,
      intakeDetails.estimatedLength && `Estimated music length: ${intakeDetails.estimatedLength}`,
      intakeDetails.tracksNeeded && `Tracks needed: ${intakeDetails.tracksNeeded}`,
      intakeDetails.desiredDeadline && `Desired deadline: ${intakeDetails.desiredDeadline}`,
      intakeDetails.estimatedBudget && `Estimated budget: ${intakeDetails.estimatedBudget}`,
      intakeDetails.rightsNeeds && `Rights/stems/ownership needs: ${intakeDetails.rightsNeeds}`,
      intakeDetails.preferredContact && `Preferred contact method: ${intakeDetails.preferredContact}`,
      notes && `Additional notes: ${notes}`,
      "File uploads: to be collected manually until upload storage is connected.",
    ].filter(Boolean);

    return lines.join("\n");
  };
  
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
        
        form.setValue("serviceId", service.id);
        form.setValue("amount", calculateAmountCents());
      }
    }
  }, [selectedServiceId, selectedDuration, services, form, recordingOption, mixOption, productionOption]);
  
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
    return calculateAmountCents() / 100;
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
    const structuredData = {
      ...data,
      amount: calculateAmountCents(),
      details: buildStructuredDetails(data.details),
    };

    if (isProductionService && productionOption === "media-quote") {
      apiRequest("POST", "/api/bookings", {
        ...structuredData,
        paymentStatus: "unpaid",
        status: "pending",
      }).then(() => {
        setBookingData(structuredData);
        setCurrentStep("confirmation");
        scrollToTop();
      }).catch(error => {
        console.error("Error submitting custom quote request:", error);
        toast({
          title: "Error",
          description: "There was an error submitting your quote request. Please contact Wiz directly.",
          variant: "destructive"
        });
      });
      return;
    }

    setBookingData(structuredData);
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
              {selectedService?.name} - {getBookingPathLabel()} {selectedDate && `- ${formatDate(selectedDate)}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Selected Path</span>
                <span>{getBookingPathLabel()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Quantity</span>
                <span>{getQuantityLabel()}</span>
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
              {selectedService?.name} - {getBookingPathLabel()} {selectedDate && `- ${formatDate(selectedDate)}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Selected Path</span>
                <span>{getBookingPathLabel()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Quantity</span>
                <span>{getQuantityLabel()}</span>
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
                    {isMixingService ? (
                      <>
                        <SelectItem value="60">1 song</SelectItem>
                        <SelectItem value="120">2 songs</SelectItem>
                        <SelectItem value="180">3 songs</SelectItem>
                        <SelectItem value="240">4 songs</SelectItem>
                        <SelectItem value="300">5 songs</SelectItem>
                        <SelectItem value="360">EP (6 songs)</SelectItem>
                        <SelectItem value="480">Album (8-10 songs)</SelectItem>
                      </>
                    ) : isProductionService ? (
                      <>
                        <SelectItem value="60">1 project</SelectItem>
                      </>
                    ) : recordingOption === "release-ready" ? (
                      <>
                        <SelectItem value="60">1 song</SelectItem>
                        <SelectItem value="120">2 songs</SelectItem>
                        <SelectItem value="180">3 songs</SelectItem>
                      </>
                    ) : (
                      <>
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

        {selectedService && (
          <Card className="bg-muted/20">
            <CardHeader className="pb-3">
              <CardTitle>Choose Your Path</CardTitle>
              <CardDescription>
                {isRecordingService && "Pick hourly session time or a release-ready song package."}
                {isMixingService && "Pick the mix/master path closest to your file condition and creative needs."}
                {isProductionService && "Pick a custom production package or request a quote for media work."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isRecordingService && (
                <RadioGroup value={recordingOption} onValueChange={setRecordingOption} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="border rounded-md p-4 cursor-pointer has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                    <div className="flex items-center gap-2 mb-2">
                      <RadioGroupItem value="hourly" />
                      <span className="font-medium">Hourly Recording Session</span>
                    </div>
                    <p className="text-sm text-muted-foreground">$50/hr, two-hour minimum. 4-hour block is $180. Session time includes recording, vocal chain, creative effects, and reference MP3.</p>
                  </label>
                  <label className="border rounded-md p-4 cursor-pointer has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                    <div className="flex items-center gap-2 mb-2">
                      <RadioGroupItem value="release-ready" />
                      <span className="font-medium">Release-Ready Song Package</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Starts at $225 per song. Includes up to two hours recording, vocal cleanup, mix, master, WAV/MP3 delivery, and one revision.</p>
                  </label>
                </RadioGroup>
              )}

              {isMixingService && (
                <RadioGroup value={mixOption} onValueChange={setMixOption} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="border rounded-md p-4 cursor-pointer has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                    <div className="flex items-center gap-2 mb-2">
                      <RadioGroupItem value="quick-finish" />
                      <span className="font-medium">Quick Finish</span>
                    </div>
                    <p className="text-sm text-muted-foreground">For organized rap sessions that already sound strong through Wiz's recording workflow. 1 song $75, 3 songs $200, 5 songs $300.</p>
                  </label>
                  <label className="border rounded-md p-4 cursor-pointer has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                    <div className="flex items-center gap-2 mb-2">
                      <RadioGroupItem value="standard" />
                      <span className="font-medium">Full Mix and Master</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Starts at $125 per song for detailed vocal cleanup, comping, tuning, automation, master, and two revisions.</p>
                  </label>
                  <label className="border rounded-md p-4 cursor-pointer has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                    <div className="flex items-center gap-2 mb-2">
                      <RadioGroupItem value="advanced" />
                      <span className="font-medium">Advanced Mix and Master</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Starts at $175 per song for stems, large vocal stacks, multiple vocalists, heavy tuning, or complex production changes.</p>
                  </label>
                  <label className="border rounded-md p-4 cursor-pointer has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                    <div className="flex items-center gap-2 mb-2">
                      <RadioGroupItem value="master-only" />
                      <span className="font-medium">Master Only</span>
                    </div>
                    <p className="text-sm text-muted-foreground">$50 per song for mixes that are already balanced and ready for mastering.</p>
                  </label>
                </RadioGroup>
              )}

              {isProductionService && (
                <RadioGroup value={productionOption} onValueChange={setProductionOption} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="border rounded-md p-4 cursor-pointer has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                    <div className="flex items-center gap-2 mb-2">
                      <RadioGroupItem value="custom-beat" />
                      <span className="font-medium">Custom Beat Production</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Starts at $200. Original custom beat, arrangement, stereo WAV/MP3, trackout stems, two revisions, and standard exclusive artist license.</p>
                  </label>
                  <label className="border rounded-md p-4 cursor-pointer has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                    <div className="flex items-center gap-2 mb-2">
                      <RadioGroupItem value="build-song" />
                      <span className="font-medium">Build-a-Song Session</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Starts at $250. Up to three hours of combined production and recording with a polished reference mix.</p>
                  </label>
                  <label className="border rounded-md p-4 cursor-pointer has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                    <div className="flex items-center gap-2 mb-2">
                      <RadioGroupItem value="complete-single" />
                      <span className="font-medium">Complete Custom Single</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Starts at $325. Custom beat, recording, Quick Finish mix, master, WAV/MP3 delivery, and one revision.</p>
                  </label>
                  <label className="border rounded-md p-4 cursor-pointer has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                    <div className="flex items-center gap-2 mb-2">
                      <RadioGroupItem value="signature-single" />
                      <span className="font-medium">Signature Custom Single</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Starts at $450. Custom production, up to four hours, detailed vocal production, full mix, master, stems, and two revisions.</p>
                  </label>
                  <label className="border rounded-md p-4 cursor-pointer md:col-span-2 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                    <div className="flex items-center gap-2 mb-2">
                      <RadioGroupItem value="media-quote" />
                      <span className="font-medium">Custom Media Quote</span>
                    </div>
                    <p className="text-sm text-muted-foreground">For film, YouTube, podcast, game, commercial, background music, or ownership buyouts. No payment should be collected until scope is confirmed.</p>
                  </label>
                </RadioGroup>
              )}
            </CardContent>
          </Card>
        )}
        
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
                      {mixOption === "quick-finish" ? "Quick Finish" : mixOption === "master-only" ? "Master Only" : mixOption === "advanced" ? "Advanced Mix and Master" : "Full Mix and Master"}
                    </span>
                    <span>{getSongCount()} {getSongCount() === 1 ? "song" : "songs"}</span>
                  </div>
                  <div className="flex justify-between font-medium pt-2 border-t border-border">
                    <span>Total</span>
                    <span>{formatPrice(calculateAmountCents())}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>25% Deposit Required</span>
                    <span>{formatPrice(calculateAmountCents() * 0.25)}</span>
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

        {selectedService && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Project Details</CardTitle>
              <CardDescription>
                {isRecordingService && "Tell Wiz what kind of session you are planning."}
                {isMixingService && "Give Wiz enough context to estimate the mix and hear the direction."}
                {isProductionService && "Describe the project so Wiz can confirm scope and pricing."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input placeholder="Artist name" value={intakeDetails.artistName} onChange={(event) => updateIntake("artistName", event.target.value)} />
                <Input placeholder={isProductionService ? "Artist, company, or project name" : "Song title"} value={isProductionService ? intakeDetails.projectName : intakeDetails.songTitle} onChange={(event) => updateIntake(isProductionService ? "projectName" : "songTitle", event.target.value)} />
                <Input placeholder="Genre or style" value={intakeDetails.genre} onChange={(event) => updateIntake("genre", event.target.value)} />
                <Input placeholder="Desired release date or deadline" value={intakeDetails.desiredDeadline} onChange={(event) => updateIntake("desiredDeadline", event.target.value)} />
              </div>

              {isRecordingService && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input placeholder="Number of artists attending" value={intakeDetails.numberOfArtists} onChange={(event) => updateIntake("numberOfArtists", event.target.value)} />
                  <Input placeholder="Estimated number of songs" value={intakeDetails.estimatedSongs} onChange={(event) => updateIntake("estimatedSongs", event.target.value)} />
                  <Select value={intakeDetails.recordingType} onValueChange={(value) => updateIntake("recordingType", value)}>
                    <SelectTrigger><SelectValue placeholder="Recording type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rap-vocals">Rap vocals</SelectItem>
                      <SelectItem value="singing-vocals">Singing vocals</SelectItem>
                      <SelectItem value="rap-and-singing">Rap and singing</SelectItem>
                      <SelectItem value="voice-over">Voice-over</SelectItem>
                      <SelectItem value="podcast">Podcast</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Beat or reference link" value={intakeDetails.referenceLink} onChange={(event) => updateIntake("referenceLink", event.target.value)} />
                </div>
              )}

              {isMixingService && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select value={intakeDetails.performanceType} onValueChange={(value) => updateIntake("performanceType", value)}>
                      <SelectTrigger><SelectValue placeholder="Performance type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rap">Rap</SelectItem>
                        <SelectItem value="singing">Singing</SelectItem>
                        <SelectItem value="rap-and-singing">Rap and singing</SelectItem>
                        <SelectItem value="instrumental">Instrumental</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={intakeDetails.vocalists} onValueChange={(value) => updateIntake("vocalists", value)}>
                      <SelectTrigger><SelectValue placeholder="Number of vocalists" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="one">One vocalist</SelectItem>
                        <SelectItem value="two">Two vocalists</SelectItem>
                        <SelectItem value="three-plus">Three or more vocalists</SelectItem>
                        <SelectItem value="not-sure">Not sure</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={intakeDetails.instrumentalFormat} onValueChange={(value) => updateIntake("instrumentalFormat", value)}>
                      <SelectTrigger><SelectValue placeholder="Instrumental format" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stereo-beat">One stereo beat</SelectItem>
                        <SelectItem value="instrumental-stems">Full instrumental stems</SelectItem>
                        <SelectItem value="instrumental-only">Instrumental only</SelectItem>
                        <SelectItem value="not-sure">Not sure</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={intakeDetails.trackCount} onValueChange={(value) => updateIntake("trackCount", value)}>
                      <SelectTrigger><SelectValue placeholder="Approximate number of audio tracks" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10 tracks</SelectItem>
                        <SelectItem value="11-20">11-20 tracks</SelectItem>
                        <SelectItem value="21-40">21-40 tracks</SelectItem>
                        <SelectItem value="41-60">41-60 tracks</SelectItem>
                        <SelectItem value="60-plus">More than 60 tracks</SelectItem>
                        <SelectItem value="not-sure">Not sure</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={intakeDetails.fileFormat} onValueChange={(value) => updateIntake("fileFormat", value)}>
                      <SelectTrigger><SelectValue placeholder="Session or file format" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pro-tools">Pro Tools session</SelectItem>
                        <SelectItem value="wav-stems">WAV stems</SelectItem>
                        <SelectItem value="stereo-beat-vocals">Stereo beat with vocal stems</SelectItem>
                        <SelectItem value="mastering-mix">One completed stereo mix for mastering</SelectItem>
                        <SelectItem value="not-sure">Not sure</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={intakeDetails.deliverySpeed} onValueChange={(value) => updateIntake("deliverySpeed", value)}>
                      <SelectTrigger><SelectValue placeholder="Delivery speed" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard turnaround</SelectItem>
                        <SelectItem value="rush">Rush delivery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select value={intakeDetails.mixStyle} onValueChange={(value) => updateIntake("mixStyle", value)}>
                      <SelectTrigger><SelectValue placeholder="Overall mix style" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="clean-natural">Clean and natural</SelectItem>
                        <SelectItem value="modern-polished">Modern and polished</SelectItem>
                        <SelectItem value="raw-aggressive">Raw and aggressive</SelectItem>
                        <SelectItem value="creative-effect-heavy">Creative and effect-heavy</SelectItem>
                        <SelectItem value="match-reference">Match my reference</SelectItem>
                        <SelectItem value="engineers-choice">Engineer's choice</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={intakeDetails.correctionPreference} onValueChange={(value) => updateIntake("correctionPreference", value)}>
                      <SelectTrigger><SelectValue placeholder="Vocal correction preference" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="natural">Keep it natural</SelectItem>
                        <SelectItem value="polished">Polished correction</SelectItem>
                        <SelectItem value="noticeable-autotune">Noticeable Auto-Tune effect</SelectItem>
                        <SelectItem value="engineers-judgment">Engineer's judgment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea placeholder="Creative effects you want: stutters, delay throws, drops, panned ad-libs, intro/outro effects, minimal effects, or let Wiz be creative." value={intakeDetails.creativeEffects} onChange={(event) => updateIntake("creativeEffects", event.target.value)} />
                  <Textarea placeholder="Describe the sound you are looking for. Clean, aggressive, dark, melodic, energetic, intimate, raw, wide, polished, or similar to a specific artist or record." value={intakeDetails.soundDescription} onChange={(event) => updateIntake("soundDescription", event.target.value)} />
                  <Input placeholder="Reference song link" value={intakeDetails.referenceLink} onChange={(event) => updateIntake("referenceLink", event.target.value)} />
                  <Textarea placeholder="What do you like about the reference? Vocal sound, effects, loudness, energy, mood, instrument balance, stereo width, or other details." value={intakeDetails.referenceNotes} onChange={(event) => updateIntake("referenceNotes", event.target.value)} />
                  <Textarea placeholder="Delivery options: WAV, MP3, clean, explicit, performance version, instrumental, acapella, radio edit, or mix stems." value={intakeDetails.deliveryOptions} onChange={(event) => updateIntake("deliveryOptions", event.target.value)} />
                </div>
              )}

              {isProductionService && (
                <div className="space-y-4">
                  <Select value={intakeDetails.projectType} onValueChange={(value) => updateIntake("projectType", value)}>
                    <SelectTrigger><SelectValue placeholder="Project type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom-artist-beat">Custom artist beat</SelectItem>
                      <SelectItem value="build-a-song">Build-a-Song session</SelectItem>
                      <SelectItem value="complete-custom-single">Complete custom single</SelectItem>
                      <SelectItem value="film-score">Film score</SelectItem>
                      <SelectItem value="youtube-music">YouTube music</SelectItem>
                      <SelectItem value="podcast-theme">Podcast intro or theme</SelectItem>
                      <SelectItem value="game-music">Game music</SelectItem>
                      <SelectItem value="commercial">Commercial or advertisement</SelectItem>
                      <SelectItem value="background-music">Background music</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea placeholder="Project description" value={intakeDetails.projectDescription} onChange={(event) => updateIntake("projectDescription", event.target.value)} />
                  <Textarea placeholder="Intended use and desired style" value={`${intakeDetails.intendedUse}${intakeDetails.intendedUse && intakeDetails.desiredStyle ? "\n" : ""}${intakeDetails.desiredStyle}`} onChange={(event) => {
                    updateIntake("intendedUse", event.target.value);
                    updateIntake("desiredStyle", "");
                  }} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input placeholder="Estimated music length" value={intakeDetails.estimatedLength} onChange={(event) => updateIntake("estimatedLength", event.target.value)} />
                    <Input placeholder="Number of tracks needed" value={intakeDetails.tracksNeeded} onChange={(event) => updateIntake("tracksNeeded", event.target.value)} />
                    <Input placeholder="Estimated budget" value={intakeDetails.estimatedBudget} onChange={(event) => updateIntake("estimatedBudget", event.target.value)} />
                    <Input placeholder="Preferred contact method" value={intakeDetails.preferredContact} onChange={(event) => updateIntake("preferredContact", event.target.value)} />
                  </div>
                  <Textarea placeholder="Do you need exclusivity, full ownership, stems, alternate versions, or rush delivery?" value={intakeDetails.rightsNeeds} onChange={(event) => updateIntake("rightsNeeds", event.target.value)} />
                  <Input placeholder="Reference songs or sound examples" value={intakeDetails.referenceLink} onChange={(event) => updateIntake("referenceLink", event.target.value)} />
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                File uploads are noted for the request, but real upload storage still needs to be connected before launch.
              </p>
            </CardContent>
          </Card>
        )}
        
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
                    <h4 className="text-sm font-medium mb-1">Quantity</h4>
                    <p>{getQuantityLabel()}</p>
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
                        : isProductionService
                          ? ""
                          : ` (${selectedDuration / 60} ${selectedDuration === 60 ? 'hour' : 'hours'})`
                      }
                    </span>
                    <span>{formatPrice(calculateAmountCents())}</span>
                  </div>
                  
                  <div className="flex justify-between mb-2 text-muted-foreground text-sm">
                    <span>Due Today (25% Deposit)</span>
                    <span>{formatPrice(calculateAmountCents() * 0.25)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Remaining Balance</span>
                    <span>{formatPrice(calculateAmountCents() * 0.75)}</span>
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
