import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Check, Mic, Sliders, Music } from "lucide-react";
import { Service } from "@shared/schema";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { scrollToTop } from "@/lib/utils";

interface ServicesSectionProps {
  services: Service[];
  isLoading: boolean;
}

const ServiceCard = ({ service }: { service: Service }) => {
  // Service icon based on name
  const getIcon = () => {
    const name = service.name.toLowerCase();
    if (name.includes("recording")) return <Mic className="h-12 w-12 text-primary" />;
    if (name.includes("mixing")) return <Sliders className="h-12 w-12 text-primary" />;
    return <Music className="h-12 w-12 text-primary" />;
  };
  
  // Button text based on name
  const getButtonText = () => {
    const name = service.name.toLowerCase();
    if (name.includes("recording")) return "Book Recording";
    if (name.includes("mixing")) return "Request Mixing/Mastering";
    return "Discuss Project";
  };
  
  return (
    <Card className="bg-light rounded-lg overflow-hidden shadow-md transition-transform hover:shadow-lg hover:-translate-y-1">
      <div className="h-48 bg-primary/10 flex items-center justify-center">
        {getIcon()}
      </div>
      <CardContent className="p-6">
        <h3 className="font-semibold text-xl mb-3">{service.name}</h3>
        <p className="text-muted-foreground mb-4">
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
            href={`/booking?type=${service.name.toLowerCase().includes("mixing") ? "mixing" : "recording"}`}
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
    <section id="services" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-bold text-3xl md:text-4xl text-foreground mb-2">Professional Services</h2>
          <h3 className="font-medium text-2xl text-primary mb-3">Your Sound, Perfected</h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comprehensive audio solutions to elevate your sound from concept to completion.
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
