import { Link } from "wouter";
import { Service } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PricingSectionProps {
  services: Service[];
  isLoading: boolean;
}

const formatPrice = (cents: number) => {
  return `$${(cents / 100).toFixed(2)}`;
};

const PricingCard = ({ 
  service, 
  isPopular 
}: { 
  service: Service, 
  isPopular: boolean 
}) => {
  // Determine which features are included/excluded
  const allPossibleFeatures = [
    "Record with Wiz",
    "Remote mix delivery",
    "Clean session files",
    "Mixing and mastering",
    "Custom beat production",
    "Creative direction"
  ];
  
  // Match features from the service with all possible features
  const featureStatus = allPossibleFeatures.map(feature => {
    return {
      feature,
      included: service.features.some(f => 
        f.toLowerCase().includes(feature.toLowerCase())
      )
    };
  });
  
  // Determine plan name based on price
  let planName = "Standard";
  if (service.price >= 17000) planName = "Premium";
  else if (service.price >= 10000) planName = "Professional";
  
  // Button text based on plan name
  const buttonText = `Book ${planName}`;
  
  return (
    <div className={`bg-light rounded-lg overflow-hidden shadow-md ${isPopular ? 'transform scale-105 shadow-lg' : ''}`}>
      <div className={`${
        isPopular 
          ? 'bg-gradient-to-r from-primary to-secondary' 
          : 'bg-[#1A1A1A]'
        } p-6 text-center relative`}
      >
        {isPopular && (
          <div className="absolute top-0 right-0 bg-[#FF8C00] text-[#1A1A1A] text-xs font-bold px-3 py-1 transform translate-y-0 translate-x-0">
            POPULAR
          </div>
        )}
        <h3 className="font-semibold text-xl text-white mb-2">{planName}</h3>
        <div className={isPopular ? "text-white" : "text-gray-100"}>
          <span className="text-3xl font-bold">{formatPrice(service.price)}</span>
          <span className="text-gray-300"> starting</span>
        </div>
      </div>
      
      <div className="p-6">
        <ul className="mb-6 space-y-3">
          {featureStatus.map((item, index) => (
            <li key={index} className="flex items-start">
              {item.included ? (
                <>
                  <Check className="h-4 w-4 text-[#FF8C00] mt-1 mr-2" />
                  <span>{item.feature}</span>
                </>
              ) : (
                <>
                  <X className="h-4 w-4 text-muted-foreground mt-1 mr-2" />
                  <span className="text-muted-foreground">{item.feature}</span>
                </>
              )}
            </li>
          ))}
        </ul>
        
        <Button asChild className="w-full bg-primary hover:bg-primary-600">
          <Link href={`/booking?type=${service.name.toLowerCase().includes("mixing") ? "mixing" : service.name.toLowerCase().includes("producer") || service.name.toLowerCase().includes("production") ? "production" : "recording"}`}>
            {buttonText}
          </Link>
        </Button>
      </div>
    </div>
  );
};

const PricingCardSkeleton = ({ isPopular }: { isPopular: boolean }) => (
  <div className={`bg-light rounded-lg overflow-hidden shadow-md ${isPopular ? 'transform scale-105 shadow-lg' : ''}`}>
    <Skeleton className={`${isPopular ? 'bg-primary/30' : 'bg-gray-600/30'} p-6 h-24`} />
    
    <div className="p-6">
      <ul className="mb-6 space-y-3">
        {Array(6).fill(0).map((_, index) => (
          <li key={index} className="flex items-start">
            <Skeleton className="h-4 w-4 mt-1 mr-2" />
            <Skeleton className="h-4 w-32" />
          </li>
        ))}
      </ul>
      
      <Skeleton className="h-10 w-full" />
    </div>
  </div>
);

export default function PricingSection({ services, isLoading }: PricingSectionProps) {
  // Sort services by price for display
  const sortedServices = [...services].sort((a, b) => a.price - b.price);
  
  // Find the middle (professional) service
  const professionalIndex = Math.floor(sortedServices.length / 2);
  
  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-bold text-3xl md:text-4xl text-foreground mb-4">Pricing Plans</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Starting points for booking Wiz directly. Final quotes can adjust for travel, rental locations, revisions, and project scope.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {isLoading ? (
            <>
              <PricingCardSkeleton isPopular={false} />
              <PricingCardSkeleton isPopular={true} />
              <PricingCardSkeleton isPopular={false} />
            </>
          ) : (
            sortedServices.map((service, index) => (
              <PricingCard 
                key={service.id} 
                service={service} 
                isPopular={index === professionalIndex}
              />
            ))
          )}
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">Need something specific or have a larger project?</p>
          <a href="#contact" className="inline-flex items-center font-medium text-primary hover:text-primary-600 transition-colors">
            <span>Contact me for custom quotes</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
