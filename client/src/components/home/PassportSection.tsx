import { Link } from "wouter";
import { ArrowRight, Check, Stamp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MEMBERSHIP_PLAN_CATALOG, formatCents } from "@shared/membership";

const passportLevels = [
  ["Passport Starter", "3 paid months", "2 hours + 1 beat lease", "/assets/lifer-passport-starter.png", "Music Lifer Passport emblem"],
  ["Passport Builder", "2 paid months", "3 hours + 1 beat lease + Quick Finish discount", "/assets/lifer-passport-builder.png", "Music Lifer Passport sound emblem"],
  ["Passport Release", "2 paid months", "3 hours + 2 beat leases + larger service discount", "/assets/lifer-passport-release.png", "Music Lifer Passport release emblem"],
];

const passportFrameClasses = [
  "border-[#8a5a1c] shadow-[8px_8px_0_#6d4918]",
  "border-[#b06b18] shadow-[8px_8px_0_#b06b18]",
  "border-[#ff8a00] shadow-[8px_8px_0_#ff8a00]",
];

export default function PassportSection() {
  return (
    <section className="bg-[#141414] py-20 text-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-10 bg-[#ff8a00]" />
              <span className="text-xs font-black uppercase tracking-[0.24em] text-[#ff8a00]">The Passport Program</span>
            </div>
            <h2 className="max-w-3xl text-4xl font-black leading-[0.95] md:text-6xl">You are not just booking studio time. You are becoming a Music Lifer.</h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/65">
              Start with a free account or choose a Passport tier for monthly access, member savings, and faster rewards.
            </p>
          </div>
          <Button asChild className="bg-black text-white hover:bg-black/85">
            <Link href="/deals">Compare All Benefits <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {MEMBERSHIP_PLAN_CATALOG.map((plan, index) => (
            <div key={plan.tier} className={`overflow-hidden border-2 bg-[#1d1d1d] p-0 ${passportFrameClasses[index]}`}>
              <div className="relative h-40 overflow-hidden border-b-2 border-[#8a5a1c] bg-black">
                <img src={passportLevels[index][3]} alt={passportLevels[index][4]} className="h-full w-full object-cover brightness-[0.82] contrast-[1.15]" />
                <div className="absolute inset-0 bg-black/25" />
                <p className="absolute bottom-3 left-4 text-xs font-black uppercase tracking-[0.2em] text-[#ffb84d]">Passport {String(index + 1).padStart(2, "0")}</p>
              </div>
              <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff8a00]">{passportLevels[index][0]}</p>
                  <h3 className="mt-2 text-2xl font-black">{plan.name}</h3>
                </div>
                <Stamp className="h-7 w-7" />
              </div>
              <p className="mt-5 text-4xl font-black">{formatCents(plan.monthlyPriceCents)}</p>
              <p className="text-sm text-white/55">month-to-month</p>
              <div className="mt-5 border-2 border-[#8a5a1c] bg-[#2a2115] p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ffb84d]">Reward after {passportLevels[index][1]}</p>
                <p className="mt-2 text-lg font-black leading-tight text-white">{passportLevels[index][2]}</p>
              </div>
              <div className="mt-5 space-y-2 text-sm">
                {plan.benefits.slice(0, 3).map((benefit) => (
                  <div key={benefit} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#ff8a00]" /><span>{benefit}</span></div>
                ))}
              </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 border-2 border-[#8a5a1c] bg-[#2a2115] p-5 text-white md:flex md:items-center md:justify-between md:gap-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff8a00]">Free Music Lifer path</p>
            <p className="mt-2 text-xl font-black">Book 5 eligible sessions and earn 2 studio hours + 1 beat lease.</p>
          </div>
          <Button asChild className="mt-5 bg-[#ff8a00] text-black hover:bg-[#ffac3d] md:mt-0"><Link href="/account/register">Create a Free Account</Link></Button>
        </div>
      </div>
    </section>
  );
}
