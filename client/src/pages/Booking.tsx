import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Loader2 } from "lucide-react";
import BookingForm from "@/components/forms/BookingForm";
import { Service, TimeSlot } from "@shared/schema";

export default function Booking() {
  const [startDate] = useState(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  });
  
  const [endDate] = useState(() => {
    const end = new Date();
    end.setDate(end.getDate() + 30); // 30 days from now
    end.setHours(23, 59, 59, 999);
    return end;
  });
  
  const { data: services, isLoading: isLoadingServices } = useQuery<Service[]>({
    queryKey: ['/api/services'],
  });
  
  const { data: timeSlots, isLoading: isLoadingTimeSlots } = useQuery<TimeSlot[]>({
    queryKey: ['/api/time-slots', { startDate: startDate.toISOString(), endDate: endDate.toISOString() }],
  });
  
  const isLoading = isLoadingServices || isLoadingTimeSlots;
  
  return (
    <>
      <Helmet>
        <title>Book a Session | SoundCraft Studios</title>
        <meta name="description" content="Book your recording, mixing, or production session at SoundCraft Studios." />
      </Helmet>
      
      <section className="py-20 bg-gradient-to-br from-primary/95 to-secondary/95 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-bold text-3xl md:text-4xl mb-4">Book a Session</h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Schedule your recording, mixing, or production session with a few simple steps.
            </p>
          </div>
          
          <div id="booking-form-container" className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6 md:p-8 text-foreground">
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
            ) : (
              <BookingForm 
                services={services || []} 
                timeSlots={timeSlots || []} 
              />
            )}
          </div>
        </div>
      </section>
    </>
  );
}
