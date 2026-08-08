import { Link } from "wouter";
import { ArrowRight, Mic2, Radio, Stamp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STUDIO_INFO } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";

export default function HeroSection() {
  const { user } = useAuth();
  const membershipHref = user ? "/account?tab=membership" : "/account/register?intent=membership";

  return (
    <section className="relative overflow-hidden bg-[#141414] text-white">
      <div className="absolute right-0 top-0 hidden h-full w-1/4 bg-[#ff8a00] md:block" />
      <div className="absolute right-[4%] top-6 hidden w-36 border-2 border-black px-3 py-3 text-right text-3xl font-black leading-[0.82] text-black md:block">
        <p>MAKE</p>
        <p>LIFE</p>
        <p>MUSIC</p>
      </div>

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-16 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-24">
        <div>
          <div className="mb-5 flex flex-wrap items-center gap-3 text-xs font-black uppercase tracking-[0.22em]">
            <span className="text-[#ff8a00]">{STUDIO_INFO.NAME}</span>
            <span className="bg-[#ff8a00] px-3 py-1 text-black">Artist Built</span>
            <span className="text-white/60">Mobile by design</span>
          </div>
          <h1 className="max-w-3xl text-5xl font-black leading-[0.92] md:text-7xl">
            Make the studio part of your rhythm.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/72 md:text-xl">
            Recording, production, mixing, and mastering with Wiz for artists who want records finished, not folders full of almosts.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-[#ff8a00] px-7 text-black hover:bg-[#ffac3d]">
              <Link href={membershipHref}>Join the Passport Program</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/70 bg-transparent px-7 text-white hover:bg-white hover:text-black">
              <Link href="/booking">Book a Session</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-white/58">
            Free Music Lifer accounts, bundle savings, and month-to-month Passport memberships. <Link href="/deals" className="font-bold text-[#ff8a00] underline underline-offset-4">Compare the paths</Link>.
          </p>
        </div>

        <div className="border-2 border-black bg-[#ff8a00] p-5 text-black shadow-[10px_10px_0_#f3eee4] md:mt-32">
          <div className="border-2 border-black bg-[#f3eee4] p-5">
            <div className="flex items-center justify-between border-b-2 border-black pb-4">
              <p className="text-xs font-black uppercase tracking-[0.2em]">Music Lifer Passport</p>
              <Radio className="h-6 w-6" />
            </div>
            <p className="mt-6 text-5xl font-black leading-[0.86]">BUILD<br />CONSISTENTLY.</p>
            <div className="mt-7 grid grid-cols-2 gap-3 text-sm font-black">
              <Link href="/booking" className="border-2 border-black bg-black p-3 text-[#ff8a00] transition-colors hover:bg-[#2a2115]"><Mic2 className="mb-3 h-5 w-5" />Record</Link>
              <Link href="/booking?type=mixing" className="border-2 border-black p-3 transition-colors hover:bg-white"><ArrowRight className="mb-3 h-5 w-5" />Finish</Link>
            </div>
            <div className="mt-5 flex items-center gap-3 border-t-2 border-black pt-4">
              <Stamp className="h-6 w-6" />
              <p className="text-sm font-bold">The more seriously you build, the faster your Passport pays you back.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
