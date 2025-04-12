import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { STUDIO_INFO } from "@/lib/constants";

export default function HeroSection() {
  return (
    <section className="relative bg-[#1A1A1A] overflow-hidden">
      <div className="absolute inset-0 z-0">
        {/* Background image - using a div with backgroundImage instead of <img> for better control */}
        <div 
          className="w-full h-full bg-cover bg-center opacity-40"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&h=1080&q=80')" 
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-secondary/80" />
      </div>
      
      <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
        <div className="max-w-3xl">
          <h1 className="font-bold text-4xl md:text-5xl lg:text-6xl text-white leading-tight mb-6">
            {STUDIO_INFO.NAME}: <br />Your Sound, Perfected.
          </h1>
          <p className="text-gray-100 text-xl md:text-2xl mb-8 max-w-2xl">
            Professional audio engineering and music production services to elevate your creative vision.
          </p>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <Button
              asChild
              size="lg"
              className={cn(
                "bg-[#FF8C00] hover:bg-[#FFA333] text-[#1A1A1A] font-medium px-8 py-6",
                "text-base"
              )}
            >
              <Link href="/booking">Book a Session</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className={cn(
                "bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary",
                "font-medium px-8 py-6 text-base"
              )}
            >
              <a href="#portfolio">Hear My Work</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
