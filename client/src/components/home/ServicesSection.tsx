import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Service } from "@shared/schema";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { scrollToTop } from "@/lib/utils";

interface ServicesSectionProps {
  services: Service[];
  isLoading: boolean;
}

const ServiceCard = ({ service }: { service: Service }) => {
  const isCustomProduction = service.name.toLowerCase().includes("production") || service.name.toLowerCase().includes("producer");

  const getArtwork = () => {
    const name = service.name.toLowerCase();
    if (name.includes("recording") || name.includes("session")) {
      return ["/assets/passport-starter-mic.png", "Modern recording mic"];
    }
    if (name.includes("mixing") || name.includes("master")) {
      return ["/assets/passport-builder-speakers.png", "Nearfield studio speakers"];
    }
    return ["/assets/passport-release-laptop.png", "Laptop and speakers"];
  };
  
  // Button text based on name
  const getButtonText = () => {
    const name = service.name.toLowerCase();
    if (name.includes("session") || name.includes("record")) return "Book a Session";
    if (name.includes("mix") || name.includes("mastering")) return "Start My Mix";
    return "Request a Custom Quote";
  };

  const getBookingType = () => {
    const name = service.name.toLowerCase();
    if (name.includes("mix") || name.includes("mastering")) return "mixing";
    if (name.includes("producer") || name.includes("production")) return "production";
    return "recording";
  };
  
  return (
    <Card className={`rounded-none border-2 bg-[#1d1d1d] text-white shadow-none transition-transform hover:-translate-y-1 hover:shadow-[8px_8px_0_#8a5a1c] ${isCustomProduction ? "border-[#9a641c]" : "border-[#6d4918]"}`}>
      <div className={`relative h-48 overflow-hidden border-b-2 bg-black ${isCustomProduction ? "border-[#9a641c]" : "border-[#6d4918]"}`}>
        <img src={getArtwork()[0]} alt={getArtwork()[1]} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/25" />
      </div>
      <CardContent className={`p-6 ${isCustomProduction ? "bg-[#211b13]" : ""}`}>
        <h3 className="font-semibold text-xl mb-3">{service.name}</h3>
        <p className="mb-4 text-white/65">
          {service.description}
        </p>
        <ul className="mb-6 space-y-2">
          {service.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="h-4 w-4 text-[#FF8C00] mt-1 mr-2" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="px-6 pb-6">
        <Button asChild className="w-full bg-primary hover:bg-primary-600">
          <Link 
            href={`/booking?type=${getBookingType()}`}
            onClick={() => scrollToTop()}
          >
            {getButtonText()}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

const ServiceCardSkeleton = () => (
  <Card className="bg-light rounded-lg overflow-hidden shadow-md">
    <Skeleton className="h-48 bg-primary/5" />
    <CardContent className="p-6">
      <Skeleton className="h-7 w-40 mb-3" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-6" />
      
      <div className="mb-6 space-y-2">
        <div className="flex items-start">
          <Skeleton className="h-4 w-4 mr-2 mt-1" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-start">
          <Skeleton className="h-4 w-4 mr-2 mt-1" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex items-start">
          <Skeleton className="h-4 w-4 mr-2 mt-1" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>
    </CardContent>
    <CardFooter className="px-6 pb-6">
      <Skeleton className="h-10 w-full" />
    </CardFooter>
  </Card>
);

export default function ServicesSection({ services, isLoading }: ServicesSectionProps) {
  return (
    <section id="services" className="bg-[#141414] py-20 text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="mb-2 text-3xl font-black md:text-4xl">Work With Wiz</h2>
          <h3 className="mb-3 text-2xl font-medium text-[#ff8a00]">Music Life Studios, personal from the first session</h3>
          <p className="mx-auto max-w-2xl text-lg text-white/65">
            Book the person touching the record: recording support, mix/master work, custom beats, and production direction built around your project.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            <>
              <ServiceCardSkeleton />
              <ServiceCardSkeleton />
              <ServiceCardSkeleton />
            </>
          ) : (
            services.map(service => (
              <ServiceCard key={service.id} service={service} />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
