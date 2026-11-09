import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Loader2 } from "lucide-react";
import BookingForm from "@/components/forms/BookingForm";
import { Service, TimeSlot } from "@shared/schema";
import { scrollToTop } from "@/lib/utils";

export default function Booking() {
  // Get service type from URL parameters
  const [preselectedServiceId, setPreselectedServiceId] = useState<number | null>(null);
  const [serviceType, setServiceType] = useState<'recording' | 'mixing' | 'production' | null>(null);
  
  // Extract service type from URL on component mount and scroll to top
  useEffect(() => {
    // Scroll to top when page loads
    scrollToTop();
    
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    
    if (type === 'mixing' || type === 'mastering' || type === 'mixing-mastering') {
      setServiceType('mixing');
    } else if (type === 'production' || type === 'producer') {
      setServiceType('production');
    } else if (type === 'recording') {
      setServiceType('recording');
    }
  }, []);

  const [startDate] = useState(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  });
  
  const [endDate] = useState(() => {
    const end = new Date();
    end.setDate(end.getDate() + 60); // Match the booking calendar window
    end.setHours(23, 59, 59, 999);
    return end;
  });
  
  const { data: services, isLoading: isLoadingServices } = useQuery<Service[]>({
    queryKey: ['/api/services'],
  });
  
  // Auto-select service when services are loaded
  useEffect(() => {
    if (services && serviceType && !preselectedServiceId) {
      const matchingService = services.find(service => {
        const name = service.name.toLowerCase();
        if (serviceType === 'mixing') {
          return name.includes('mix') || name.includes('master');
        } else if (serviceType === 'production') {
          return name.includes('producer') ||
                name.includes('production') ||
                name.includes('composition');
        } else if (serviceType === 'recording') {
          return name.includes('recording') || 
                name.includes('session') ||
                name.includes('book a session');
        }
        return false;
      });
      
      if (matchingService) {
        setPreselectedServiceId(matchingService.id);
      }
    }
  }, [services, serviceType, preselectedServiceId]);
  
  const { data: timeSlots, isLoading: isLoadingTimeSlots } = useQuery<TimeSlot[]>({
    queryKey: ['/api/time-slots', { startDate: startDate.toISOString(), endDate: endDate.toISOString() }],
  });
  
  const isLoading = isLoadingServices || isLoadingTimeSlots;
  
  return (
    <>
      <Helmet>
        <title>Book a Session | Music Life Studios</title>
        <meta name="description" content="Book Wiz for recording, remote mixing and mastering, or custom production through Music Life Studios." />
      </Helmet>
      
      <section className="bg-gradient-to-br from-primary/95 to-secondary/95 py-8 text-white sm:py-12 md:py-20">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="mb-8 text-center md:mb-16">
            <h2 className="font-bold text-3xl md:text-4xl mb-4">Book a Session</h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Book Wiz for recording, remote mixing/mastering, or custom production work with a few simple steps.
            </p>
          </div>
          
          <div id="booking-form-container" className="mx-auto max-w-6xl rounded-lg bg-white p-3 text-foreground shadow-lg sm:p-6 md:p-10">
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
            ) : (
              <BookingForm 
                services={services || []} 
                timeSlots={timeSlots || []}
                preselectedServiceId={preselectedServiceId}
                serviceType={serviceType}
              />
            )}
          </div>
        </div>
      </section>
    </>
  );
}
