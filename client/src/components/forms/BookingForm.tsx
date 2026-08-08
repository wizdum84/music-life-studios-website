import { useState, useEffect } from "react";
import { Link } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { TimeSlot, Service } from "@shared/schema";
import { calculatePricing } from "@shared/pricing";
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
import { StripePaymentForm } from "@/components/forms/StripePaymentForm";

// Form schema
const formSchema = z.object({
  serviceId: z.number({
    required_error: "Please select a service",
  }),
  name: z.string().min(2, {
    message: "Artist or stage name must be at least 2 characters",
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
type BookingDraft = FormData & { id?: number; contractId?: number; paymentStatus?: string; status?: string };

function getLocalDateKey(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatPhoneNumber(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  digits = digits.slice(0, 10);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

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
  const [selectedDuration, setSelectedDuration] = useState<number | null>(120);
  const [availableTimes, setAvailableTimes] = useState<TimeSlot[]>([]);
  const [bookingData, setBookingData] = useState<BookingDraft | null>(null);
  const shouldShowServiceSelect = !selectedServiceId;
  const [recordingOption, setRecordingOption] = useState("hourly");
  const [mixOption, setMixOption] = useState("quick-finish");
  const [productionOption, setProductionOption] = useState("custom-beat");
  const [intakeDetails, setIntakeDetails] = useState({
    songTitle: "",
    numberOfArtists: "",
    sessionFocus: "",
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
    referenceAudioName: "",
    beatOrTracksFileName: "",
    beatOrTracksLink: "",
    referenceNotes: "",
    deliveryOptions: "",
    projectName: "",
    projectDescription: "",
    intendedUse: "",
    desiredStyle: "",
    estimatedLength: "",
    tracksNeeded: "",
    desiredDeadline: "",
    estimatedBudget: "",
    rightsNeeds: "",
    beatLicenseProduct: "",
    portfolioRelease: "",
    preferredContact: "",
  });
  
  const selectedService = selectedServiceId ? services.find(s => s.id === selectedServiceId) : null;

  const normalizeServiceTypeFromName = (name?: string): 'recording' | 'mixing' | 'production' | null => {
    if (!name) return null;
    const lower = name.toLowerCase();
    if (lower.includes('mix') || lower.includes('master')) return 'mixing';
    if (lower.includes('producer') || lower.includes('production') || lower.includes('composition')) return 'production';
    if (lower.includes('record') || lower.includes('session')) return 'recording';
    return null;
  };

  const normalizedServiceType = serviceType ?? normalizeServiceTypeFromName(selectedService?.name);

  const isMixingService = normalizedServiceType === 'mixing';
  const isRecordingService = normalizedServiceType === 'recording';
  const isProductionService = normalizedServiceType === 'production';
  
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

  const getBookingServicePath = () => {
    if (isRecordingService) return recordingOption;
    if (isMixingService) return mixOption;
    if (isProductionService) return productionOption;
    return "hourly";
  };

  const getCheckoutSummary = () => {
    const orderContext = `Your order is ${getBookingPathLabel()}${selectedDate ? ` on ${formatDate(selectedDate)}` : ""}${calculateAmountCents() > 0 ? ` for ${formatPrice(calculateAmountCents())}` : ""}.`;

    switch (getBookingServicePath()) {
      case "hourly":
        return `${orderContext} The price covers the reserved session and the recording items listed below; it does not promise a finished song count or final mix unless selected. Payment, balance, cancellation, file, and signature terms are shown in the agreement.`;
      case "release-ready":
        return `${orderContext} This covers the included recording time, mix/master, WAV and MP3 delivery, and one revision. Extra work is approved before it is added.`;
      case "quick-finish":
        return `${orderContext} This covers light finishing, final mix/master, WAV and MP3 delivery, and one minor revision per song.`;
      case "standard":
        return `${orderContext} This covers detailed cleanup, mix/master, WAV and MP3 delivery, and two revisions.`;
      case "advanced":
        return `${orderContext} The final scope and price are confirmed after file review before extra work begins.`;
      case "master-only":
        return `${orderContext} This covers mastering and delivery formats for a supplied stereo mix; multitrack mixing and major fixes are separate.`;
      case "custom-beat":
        return `${orderContext} The service covers the production items listed below; beat rights, ownership, and publishing are separate and must be shown in the agreement.`;
      case "build-song":
        return `${orderContext} This covers the selected creative time and a reference mix; final mixing, mastering, and beat rights are separate unless shown below.`;
      case "complete-single":
        return `${orderContext} This covers the listed production, recording, Quick Finish, and master deliverables; beat rights and ownership are separate.`;
      case "signature-single":
        return `${orderContext} This covers the listed production, recording, vocal, mix/master, and stem deliverables; rights and splits are shown separately.`;
      case "media-quote":
        return "This is a custom media project request. Scope, price, rights, delivery, and timing must be confirmed before the project can be finalized.";
      default:
        return "You are agreeing to the selected service, price, delivery, payment, and cancellation terms shown below.";
    }
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
    if (!selectedService || !selectedDuration) return 0;

    return getPricingResult().finalTotal;
  };

  const getPricingResult = () => {
    if (!selectedService || !selectedDuration) {
      return {
        serviceId: selectedService?.id ?? 0,
        quantity: 0,
        unitType: "project" as const,
        standardUnitPrice: 0,
        standardTotal: 0,
        bundleDiscount: 0,
        finalTotal: 0,
        effectiveUnitPrice: 0,
        requiresManualQuote: false,
      };
    }

    return calculatePricing({
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      duration: selectedDuration,
      recordingOption,
      mixOption,
      productionOption,
    });
  };

  const buildStructuredDetails = (notes?: string) => {
    const lines = [
      `Service path: ${isRecordingService ? recordingOption : isMixingService ? mixOption : isProductionService ? productionOption : "general"}`,
      intakeDetails.songTitle && `Song title: ${intakeDetails.songTitle}`,
      intakeDetails.numberOfArtists && `Number of artists attending: ${intakeDetails.numberOfArtists}`,
      intakeDetails.sessionFocus && `Session focus: ${intakeDetails.sessionFocus}`,
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
      intakeDetails.referenceAudioName && `Reference audio file: ${intakeDetails.referenceAudioName}`,
      intakeDetails.beatOrTracksFileName && `Beat or tracks file: ${intakeDetails.beatOrTracksFileName}`,
      intakeDetails.beatOrTracksLink && `Beat or tracks link: ${intakeDetails.beatOrTracksLink}`,
      intakeDetails.referenceNotes && `Reference notes: ${intakeDetails.referenceNotes}`,
      intakeDetails.deliveryOptions && `Delivery options: ${intakeDetails.deliveryOptions}`,
      intakeDetails.projectName && `Project/company name: ${intakeDetails.projectName}`,
      intakeDetails.projectDescription && `Project description: ${intakeDetails.projectDescription}`,
      intakeDetails.intendedUse && `Intended use: ${intakeDetails.intendedUse}`,
      intakeDetails.desiredStyle && `Desired style: ${intakeDetails.desiredStyle}`,
      intakeDetails.estimatedLength && `Estimated music length: ${intakeDetails.estimatedLength}`,
      intakeDetails.tracksNeeded && `Tracks needed: ${intakeDetails.tracksNeeded}`,
      intakeDetails.desiredDeadline && `Desired deadline: ${intakeDetails.desiredDeadline}`,
      intakeDetails.estimatedBudget && `Estimated budget: ${intakeDetails.estimatedBudget}`,
      intakeDetails.rightsNeeds && `Rights/stems/ownership needs: ${intakeDetails.rightsNeeds}`,
      intakeDetails.beatLicenseProduct && `Beat rights requested: ${intakeDetails.beatLicenseProduct}`,
      intakeDetails.portfolioRelease && `Portfolio use request: ${intakeDetails.portfolioRelease}`,
      intakeDetails.preferredContact && `Preferred contact method: ${intakeDetails.preferredContact}`,
      notes && `Additional notes: ${notes}`,
    ].filter(Boolean);

    return lines.join("\n");
  };
  
  // Update available times when date changes
  useEffect(() => {
    if (selectedDate) {
      const timesForDay = timeSlots.filter(slot => {
        return slot.available && getLocalDateKey(slot.date) === getLocalDateKey(selectedDate);
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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

  useEffect(() => {
    if (!isRecordingService) return;

    const validDurations = recordingOption === "release-ready"
      ? [60, 120, 180, 240, 300]
      : [120, 180, 240, 300, 360, 420, 480];
    if (!selectedDuration || !validDurations.includes(selectedDuration)) {
      const nextDuration = recordingOption === "release-ready" ? 60 : 120;
      setSelectedDuration(nextDuration);
      form.setValue("duration", nextDuration);
    }
  }, [form, isRecordingService, recordingOption, selectedDuration]);

  const selectedServiceName = selectedService ? selectedService.name : null;
  
  // Sync external preselected service into internal state
  useEffect(() => {
    if (preselectedServiceId !== null && preselectedServiceId !== undefined && preselectedServiceId !== selectedServiceId) {
      setSelectedServiceId(preselectedServiceId);
    }
  }, [preselectedServiceId, selectedServiceId]);

  // Handle service selection
  const handleServiceChange = (value: string) => {
    const serviceId = parseInt(value);
    setSelectedServiceId(serviceId);
    
    // Debug service selection
    const service = services.find(s => s.id === serviceId);
    console.log(`Service changed to: ${service?.name} (ID: ${serviceId})`);
    console.log(`Recording service? ${service?.name.toLowerCase().includes('recording') || service?.name.toLowerCase().includes('session')}`);
    
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
    if (isRecordingService) {
      form.setValue("date", "", { shouldValidate: true });
      form.setValue("timeSlotId", undefined as unknown as number, { shouldValidate: true });
    }
  };
  
  // Handle time slot selection
  const handleTimeSelect = (timeSlot: TimeSlot) => {
    setSelectedTime(timeSlot);
    form.setValue("timeSlotId", timeSlot.id, { shouldValidate: true });
    form.setValue("date", new Date(timeSlot.date).toISOString(), { shouldValidate: true });
  };
  
  // Handle date selection for services that use a project date instead of a fixed studio time slot.
  useEffect(() => {
    if (selectedDate && (isMixingService || isProductionService)) {
      // Use a placeholder time slot ID that will be handled differently on the server
      form.setValue("timeSlotId", -1);
      
      // Format the date with noon time to make a complete ISO string
      const dateWithNoon = new Date(selectedDate);
      dateWithNoon.setHours(12, 0, 0, 0);
      
      form.setValue("date", dateWithNoon.toISOString());
      
      console.log(`Date set for ${isProductionService ? "production" : "mixing"} service: ${dateWithNoon.toISOString()}`);
    }
  }, [isMixingService, isProductionService, selectedDate, form]);
  
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
  const handleContractSigned = async () => {
    if (!bookingData) return;
    try {
      let paymentBooking = bookingData;
      if (!bookingData.id) {
        const response = await apiRequest("POST", "/api/bookings", {
          ...bookingData,
          status: "pending",
          paymentStatus: "unpaid",
        });
        const createdBooking = await response.json();
        paymentBooking = { ...bookingData, id: createdBooking.id, amount: createdBooking.amount, paymentStatus: createdBooking.paymentStatus };
        setBookingData(paymentBooking);
      }
      setContractSigned(true);
      setCurrentStep('payment');
      scrollToTop();
    } catch (error) {
      console.error("Error creating booking hold:", error);
      const description = error instanceof Error && error.message
        ? error.message
        : "Your booking could not be initialized. Please try again.";
      toast({ title: "Unable to start checkout", description, variant: "destructive" });
    }
  };
  
  // Form submission
  const onSubmit = async (data: FormData) => {
    console.log("Form submitted with data:", data);
    const structuredData = {
      ...data,
      amount: calculateAmountCents(),
      details: buildStructuredDetails(),
    };
    const pricing = getPricingResult();

    if (pricing.requiresManualQuote) {
      apiRequest("POST", "/api/bookings", {
        ...structuredData,
        amount: 0,
        paymentStatus: "unpaid",
        status: "pending",
      }).then(() => {
        setBookingData({ ...structuredData, amount: 0 });
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

    try {
      const response = await apiRequest("POST", "/api/contracts/preview", {
        serviceId: data.serviceId,
        servicePath: getBookingServicePath(),
        durationMinutes: data.duration,
        date: data.date,
        customerName: data.name,
        customerEmail: data.email,
        beatLicenseProduct: intakeDetails.beatLicenseProduct || undefined,
        requestedAddOns: intakeDetails.deliveryOptions || undefined,
        portfolioReleaseRequested: intakeDetails.portfolioRelease === "discuss",
      });
      const preview = await response.json();
      if (!response.ok) throw new Error(preview.error || "Unable to prepare the agreement");

      setBookingData({
        ...structuredData,
        amount: preview.pricing.finalTotal,
        contractId: preview.contract.id,
      });
      setCurrentStep("contract");
      scrollToTop();
    } catch (error) {
      console.error("Error generating booking agreement:", error);
      toast({
        title: "Unable to prepare agreement",
        description: error instanceof Error ? error.message : "Please review your booking details and try again.",
        variant: "destructive",
      });
    }
  };
  
  // Payment completion handler
  const handlePaymentComplete = (transactionId: string) => {
    // Stripe has already verified and recorded the payment server-side.
    setBookingData((current) => current ? { ...current, paymentStatus: paymentOption === 'deposit' ? 'deposit_paid' : 'paid', status: 'confirmed' } : current);
    if (tipAmount > 0) setTipAmount(0);
    scrollToTop();
    setCurrentStep('confirmation');
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
    let contractId = bookingData.contractId ?? 1;
    let contractTitle = bookingData.contractId ? "Transaction Agreement" : "Studio Rules & Agreement";
    
    // If service is mixing/mastering, use different contract
    if (!bookingData.contractId && isMixingService) {
      contractId = 2; // Use mixing/mastering contract
      contractTitle = "Mixing & Mastering Agreement";
    } 
    // For recording sessions, make sure we use the studio rules contract
    else if (!bookingData.contractId && isRecordingService) {
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
            plainLanguageSummary={getCheckoutSummary()}
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
                Pay Deposit (50%)
              </TabsTrigger>
              <TabsTrigger value="full" className="flex gap-2 items-center">
                <DollarSign className="h-4 w-4" />
                Pay Full Amount
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="deposit">
              <p className="text-sm text-muted-foreground mb-4">
                Pay 50% now to secure your booking. The remaining balance will be due at the session.
              </p>
              <div className="font-medium flex justify-between">
                <span>Deposit Due Now:</span>
                <span>{formatPrice(Math.round((bookingData?.amount || 0) * 0.5))}</span>
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
        
        {/* Stripe Payment Form */}
        <StripePaymentForm
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
      <form
        onSubmit={form.handleSubmit(onSubmit, () => {
          const missing = !selectedDate
            ? "Select a date."
            : isRecordingService && !selectedTime
              ? "Select an available start time for your session."
              : "Enter your artist name and email before continuing.";
          toast({
            title: "Complete the booking details",
            description: missing,
            variant: "destructive",
          });
        })}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {shouldShowServiceSelect ? (
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
          ) : (
            <div className="col-span-2 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm text-primary font-semibold mb-2">Service selected:</p>
              <p className="font-medium text-lg">{selectedServiceName || "Selected service"}</p>
              <p className="text-sm text-muted-foreground mt-2">
                You selected this service from the previous page. If you want a different service, choose it from the homepage.
              </p>
              <div className="mt-4">
                <Button asChild variant="outline" size="sm" className="px-4 py-2">
                  <Link href="/">Choose a different service</Link>
                </Button>
              </div>
            </div>
          )}
          
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
                        <SelectItem value="60">1 {productionOption === "custom-beat" ? "beat" : "song"}</SelectItem>
                        {productionOption !== "media-quote" && (
                          <>
                            <SelectItem value="120">2 {productionOption === "custom-beat" ? "beats" : "songs"}</SelectItem>
                            <SelectItem value="180">3 {productionOption === "custom-beat" ? "beats" : "songs"}</SelectItem>
                            <SelectItem value="240">4 {productionOption === "custom-beat" ? "beats" : "songs"}</SelectItem>
                          </>
                        )}
                      </>
                    ) : recordingOption === "release-ready" ? (
                      <>
                        <SelectItem value="60">1 song</SelectItem>
                        <SelectItem value="120">2 songs</SelectItem>
                        <SelectItem value="180">3 songs</SelectItem>
                        <SelectItem value="240">4 songs</SelectItem>
                        <SelectItem value="300">5 songs</SelectItem>
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
                <>
                  <div className="rounded-md border border-dashed border-primary/50 bg-primary/5 p-4 mb-4 text-sm font-medium text-primary">
                    Hourly session discounts apply for 4+ hour blocks, with additional bundle pricing up to 8 hours.
                  </div>
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
              </>
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
                    <span>50% Deposit Required</span>
                    <span>{formatPrice(Math.round(calculateAmountCents() * 0.5))}</span>
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
                <FormLabel>Artist / Stage Name</FormLabel>
                <FormControl>
                  <Input placeholder="Artist or stage name" {...field} />
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
                  <Input
                    placeholder="555-123-4567"
                    inputMode="tel"
                    {...field}
                    onChange={(event) => field.onChange(formatPhoneNumber(event.target.value))}
                  />
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
              <div className={`grid grid-cols-1 gap-4 ${isRecordingService && recordingOption === "hourly" ? "md:grid-cols-1" : "md:grid-cols-2"}`}>
                {isProductionService ? (
                  <Input placeholder="Artist, company, or project name" value={intakeDetails.projectName} onChange={(event) => updateIntake("projectName", event.target.value)} />
                ) : recordingOption === "release-ready" ? (
                  <Input placeholder="Song title" value={intakeDetails.songTitle} onChange={(event) => updateIntake("songTitle", event.target.value)} />
                ) : (
                  <Input placeholder="What are you working on? (optional)" value={intakeDetails.sessionFocus} onChange={(event) => updateIntake("sessionFocus", event.target.value)} />
                )}
                {(isProductionService || recordingOption === "release-ready") && (
                  <Input placeholder={isProductionService ? "Desired completion date" : "Desired release date"} value={intakeDetails.desiredDeadline} onChange={(event) => updateIntake("desiredDeadline", event.target.value)} />
                )}
              </div>

              {isRecordingService && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select value={intakeDetails.numberOfArtists} onValueChange={(value) => updateIntake("numberOfArtists", value)}>
                    <SelectTrigger><SelectValue placeholder="How many people are attending?" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 person</SelectItem>
                      <SelectItem value="2">2 people</SelectItem>
                      <SelectItem value="3">3 people</SelectItem>
                      <SelectItem value="4">4 people</SelectItem>
                      <SelectItem value="5">5 people</SelectItem>
                      <SelectItem value="6-plus">6 or more people</SelectItem>
                    </SelectContent>
                  </Select>
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
                  {productionOption !== "media-quote" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Select value={intakeDetails.beatLicenseProduct} onValueChange={(value) => updateIntake("beatLicenseProduct", value)}>
                        <SelectTrigger><SelectValue placeholder="Select beat rights" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="commercial_lease">Commercial Beat Lease</SelectItem>
                          <SelectItem value="paid_nonexclusive">Paid Nonexclusive License</SelectItem>
                          <SelectItem value="exclusive">Exclusive Rights (manual review)</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={intakeDetails.portfolioRelease} onValueChange={(value) => updateIntake("portfolioRelease", value)}>
                        <SelectTrigger><SelectValue placeholder="Portfolio use" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no">No portfolio request</SelectItem>
                          <SelectItem value="discuss">Discuss portfolio use separately</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <Textarea placeholder="Other rights, stems, alternate versions, or rush needs?" value={intakeDetails.rightsNeeds} onChange={(event) => updateIntake("rightsNeeds", event.target.value)} />
                </div>
              )}

              {isMixingService && (
                <div className="space-y-2 rounded-md border border-dashed p-4">
                  <label htmlFor="reference-audio" className="text-sm font-medium">Reference track <span className="text-muted-foreground font-normal">(optional)</span></label>
                  <Input
                    id="reference-audio"
                    type="file"
                    accept=".mp3,.wav,audio/mpeg,audio/wav"
                    onChange={(event) => updateIntake("referenceAudioName", event.target.files?.[0]?.name || "")}
                  />
                  <p className="text-xs text-muted-foreground">MP3 or WAV. The filename will be attached to this request; upload storage will be connected next.</p>
                </div>
              )}

              {(isRecordingService || isProductionService) && (
                <div className="space-y-3 rounded-md border border-dashed p-4">
                  <div>
                    <label htmlFor="beat-or-tracks" className="text-sm font-medium">Beat, tracks, or source audio</label>
                    <p className="text-xs text-muted-foreground mt-1">Upload what you are bringing, or paste a link so Wiz can review the source material.</p>
                  </div>
                  <Input
                    id="beat-or-tracks"
                    type="file"
                    accept=".mp3,.wav,.aiff,.zip,audio/mpeg,audio/wav,audio/aiff,application/zip"
                    onChange={(event) => updateIntake("beatOrTracksFileName", event.target.files?.[0]?.name || "")}
                  />
                  <Input
                    type="url"
                    placeholder="YouTube, SoundCloud, Google Drive, or other link"
                    value={intakeDetails.beatOrTracksLink}
                    onChange={(event) => updateIntake("beatOrTracksLink", event.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">The file name and link will be attached to this request. Secure audio storage will be connected next.</p>
                </div>
              )}

              {(isMixingService || isProductionService) && (
                <FormField
                  control={form.control}
                  name="details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Anything else Wiz should know? <span className="text-muted-foreground text-xs">(optional)</span></FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={isMixingService
                            ? "Share any important mix direction, problem areas, references, or revision notes."
                            : "Share anything else about the project, scope, rights, or delivery needs."
                          }
                          className="min-h-[90px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
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
                  
                  <div className="flex justify-between mb-2 text-muted-foreground text-sm">
                    <span>Total</span>
                    <span>{formatPrice(calculateAmountCents())}</span>
                  </div>

                  <div className="flex justify-between mb-2 text-muted-foreground text-sm">
                    <span>Due Today (50% Deposit)</span>
                    <span>{formatPrice(Math.round(calculateAmountCents() * 0.5))}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Remaining Balance</span>
                    <span>{formatPrice(calculateAmountCents() * 0.5)}</span>
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
          >
            Continue to Contract
          </Button>
        </div>
      </form>
    </Form>
  );
}
