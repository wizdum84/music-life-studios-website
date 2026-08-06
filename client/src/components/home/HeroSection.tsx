import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { STUDIO_INFO } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";

export default function HeroSection() {
  const { user } = useAuth();
  const membershipHref = user ? "/account?tab=membership" : "/account/register?intent=membership";

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
            {STUDIO_INFO.NAME}
          </h1>
          <p className="uppercase tracking-[0.2em] text-sm md:text-base text-[#FF8C00] font-semibold mb-3">
            {STUDIO_INFO.BYLINE}
          </p>
          <h2 className="font-medium text-2xl md:text-3xl text-white mb-4">
            Build your sound with consistent studio access.
          </h2>
          <p className="text-gray-100 text-xl md:text-2xl mb-8 max-w-2xl">
            Join a Music Life Artist Membership for predictable monthly recording hours, finishing credits, member pricing, and priority booking with WIZ.
          </p>
          <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl text-sm text-white">
            <div className="border border-white/30 bg-black/20 px-4 py-3">
              <span className="block text-[#FF8C00] font-semibold">$149/mo</span>
              Artist Access
            </div>
            <div className="border border-white/30 bg-black/20 px-4 py-3">
              <span className="block text-[#FF8C00] font-semibold">$325/mo</span>
              Consistent Artist
            </div>
            <div className="border border-white/30 bg-black/20 px-4 py-3">
              <span className="block text-[#FF8C00] font-semibold">$499/mo</span>
              Release Artist
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <Button
              asChild
              size="lg"
              className={cn(
                "bg-[#FF8C00] hover:bg-[#FFA333] text-[#1A1A1A] font-medium px-8 py-6",
                "text-base"
              )}
            >
              <Link href={membershipHref}>Join a Membership</Link>
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
              <Link href="/deals">View Deals & Savings</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-white/80">
            Month-to-month memberships, bundle discounts, and loyalty rewards. <Link href="/booking" className="underline underline-offset-4">Book once instead</Link>.
          </p>
        </div>
      </div>
    </section>
  );
}
