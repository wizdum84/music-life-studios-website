import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PricingSectionProps {
  services: unknown[];
  isLoading: boolean;
}

const pricingGroups = [
  {
    title: "Book a Session",
    subtitle: "$50/hr, 2-hour minimum",
    note: "4-hour block: $180",
    href: "/booking?type=recording",
    cta: "Book a Session",
    features: [
      "Recording engineer with Wiz",
      "Vocal chain, effects, and drops during the session",
      "Polished studio reference mix and MP3 export",
      "Studio time, not a guaranteed song count"
    ]
  },
  {
    title: "Mix and Master",
    subtitle: "Quick Finish from $75",
    note: "Full mix/master starts at $125 per song",
    href: "/booking?type=mixing",
    cta: "Start My Mix",
    featured: true,
    features: [
      "Quick Finish: 1 song $75, 3 songs $200, 5 songs $300",
      "Advanced mix/master starts at $175 per song",
      "Master only: $50 per song",
      "WAV and MP3 delivery with revision options"
    ]
  },
  {
    title: "Custom Production",
    subtitle: "Custom beats from $200",
    note: "Media and buyout projects quoted after review",
    href: "/booking?type=production",
    cta: "Request a Custom Quote",
    features: [
      "Custom beat, Build-a-Song, or full single packages",
      "Film, YouTube, podcast, game, and brand music",
      "Stems, exclusivity, ownership, and revisions scoped upfront",
      "No payment collected until custom scope is confirmed"
    ]
  }
];

const PricingCard = ({ group }: { group: typeof pricingGroups[number] }) => {
  return (
    <div className={`bg-light rounded-lg overflow-hidden shadow-md ${group.featured ? 'transform scale-105 shadow-lg' : ''}`}>
      <div className={`${
        group.featured 
          ? 'bg-gradient-to-r from-primary to-secondary' 
          : 'bg-[#1A1A1A]'
        } p-6 text-center relative`}
      >
        {group.featured && (
          <div className="absolute top-0 right-0 bg-[#FF8C00] text-[#1A1A1A] text-xs font-bold px-3 py-1 transform translate-y-0 translate-x-0">
            POPULAR
          </div>
        )}
        <h3 className="font-semibold text-xl text-white mb-2">{group.title}</h3>
        <p className={group.featured ? "text-white text-2xl font-bold" : "text-gray-100 text-2xl font-bold"}>{group.subtitle}</p>
        <p className="text-gray-300 text-sm mt-2">{group.note}</p>
      </div>
      
      <div className="p-6">
        <ul className="mb-6 space-y-3">
          {group.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="h-4 w-4 text-[#FF8C00] mt-1 mr-2 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        
        <Button asChild className="w-full bg-primary hover:bg-primary-600">
          <Link href={group.href}>
            {group.cta}
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
  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-bold text-3xl md:text-4xl text-foreground mb-4">Pricing Plans</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Exact prices where the scope is predictable, starting prices where the creative work depends on the files, arrangement, usage, and timeline.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {isLoading ? (
            <>
              <PricingCardSkeleton isPopular={false} />
              <PricingCardSkeleton isPopular={true} />
              <PricingCardSkeleton isPopular={false} />
            </>
          ) : pricingGroups.map((group) => <PricingCard key={group.title} group={group} />)}
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
