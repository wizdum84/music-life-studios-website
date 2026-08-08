import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { ArrowRight, CalendarDays, Check, Disc3, Mic2, Radio, ReceiptText, SlidersHorizontal, Stamp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MEMBERSHIP_PLAN_CATALOG, formatCents } from "@shared/membership";

const dark = "#141414";
const ink = "#0d0d0d";
const gold = "#ff8a00";
const paper = "#f3eee4";

const bundleRows = [
  ["Recording 4 hours", "$200", "$180", "$20"],
  ["Recording 8 hours", "$400", "$340", "$60"],
  ["Release-Ready 3 songs", "$675", "$600", "$75"],
  ["Quick Finish 5 songs", "$375", "$300", "$75"],
  ["Master Only 8 songs", "$400", "$330", "$70"],
];

const passportRewards = [
  {
    name: "Passport Starter",
    unlock: "3 paid months",
    reward: "2 studio hours + 1 beat lease",
  },
  {
    name: "Passport Builder",
    unlock: "2 paid months",
    reward: "3 studio hours + 1 beat lease + Quick Finish discount",
  },
  {
    name: "Passport Release",
    unlock: "2 paid months",
    reward: "3 studio hours + 2 beat leases + larger service discount",
  },
];

const passportArtwork = [
  ["/assets/lifer-passport-starter.png", "Music Lifer Passport emblem"],
  ["/assets/lifer-passport-builder.png", "Music Lifer Passport sound emblem"],
  ["/assets/lifer-passport-release.png", "Music Lifer Passport release emblem"],
];

function PreviewLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="h-px w-10 bg-[#ff8a00]" />
      <span className="text-xs font-bold uppercase tracking-[0.26em] text-[#ff8a00]">{children}</span>
    </div>
  );
}

function HeroA() {
  return (
    <section className="relative overflow-hidden bg-[#151515] text-white">
      <div className="absolute right-0 top-0 hidden h-full w-1/4 bg-[#ff8a00] md:block" />
      <div className="absolute right-[8%] top-10 hidden border-2 border-black px-4 py-3 text-right text-4xl font-black leading-none text-black md:block">
        <p>MAKE</p>
        <p>LIFE</p>
        <p>MUSIC</p>
      </div>
      <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-28">
        <PreviewLabel>Hero Direction A</PreviewLabel>
        <h1 className="max-w-4xl text-5xl font-black leading-[0.95] md:text-7xl">
          Build consistently. Leave with records that sound finished.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/78 md:text-xl">
          Recording, mixing, mastering, production, and monthly artist memberships with Wiz at Music Life Studios.
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="bg-[#ff8a00] text-black hover:bg-[#ffac3d]">
            <Link href="/account/register?intent=membership">Join a Membership</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-white/70 bg-transparent text-white hover:bg-white hover:text-black">
            <Link href="/deals">See Deals & Bundles</Link>
          </Button>
        </div>
        <div className="mt-12 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
          {["$149/mo Artist Access", "$325/mo Consistent Artist", "$499/mo Release Artist"].map((item) => (
            <div key={item} className="border border-white/20 bg-black/35 px-4 py-3 text-sm font-semibold">
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HeroB() {
  return (
    <section className="bg-[#0f0f0f] text-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-20 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div>
          <PreviewLabel>Hero Direction B</PreviewLabel>
          <h1 className="text-5xl font-black leading-none md:text-7xl">The room, the ear, the finish.</h1>
          <p className="mt-6 max-w-xl text-lg text-white/75">
            Book Wiz for one session, or become a monthly member and keep momentum without guessing your studio budget.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="bg-[#ff8a00] text-black hover:bg-[#ffac3d]">
              <Link href="/account/register?intent=membership">Start Monthly</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/70 bg-transparent text-white hover:bg-white hover:text-black">
              <Link href="/booking">Book One Session</Link>
            </Button>
          </div>
        </div>
        <div className="border border-[#ff8a00]/50 bg-[#191919] p-5 shadow-[12px_12px_0_#ff8a00]">
          <div className="border border-white/10 bg-black p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-[#ff8a00]">Session Note</p>
            <p className="mt-5 text-3xl font-black">Consistency beats random sessions.</p>
            <div className="mt-6 space-y-3 text-sm text-white/75">
              <p>3 to 8 included recording hours</p>
              <p>Quick Finish and Master Only credits</p>
              <p>Member rates and priority booking</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroC() {
  return (
    <section className="bg-[#f3eee4] text-[#111]">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <PreviewLabel>Hero Direction C</PreviewLabel>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-end">
          <div className="border-2 border-black bg-[#ff8a00] p-6">
            <p className="text-sm font-black uppercase tracking-[0.2em]">Music Life Studios</p>
            <p className="mt-12 text-6xl font-black leading-none">Artist Pass</p>
          </div>
          <div>
            <h1 className="text-5xl font-black leading-none md:text-7xl">Your next records need a system.</h1>
            <p className="mt-5 max-w-2xl text-lg text-black/70">
              Studio access, finishing help, member savings, and a plan for artists who are done waiting on inspiration alone.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="bg-black text-white hover:bg-black/85">
                <Link href="/deals">Compare Memberships</Link>
              </Button>
              <Button asChild variant="outline" className="border-black bg-transparent text-black hover:bg-black hover:text-white">
                <Link href="/booking">Book Today</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AttemptTwo() {
  return (
    <section className="bg-[#f3eee4] text-[#111]">
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <PreviewLabel>Attempt Two</PreviewLabel>
        <div className="border-2 border-[#111] bg-[#f8f1e4]">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_0.9fr]">
            <div className="flex min-h-[560px] flex-col justify-between p-6 md:p-10">
              <div>
                <div className="flex flex-wrap items-center gap-3 border-b-2 border-[#111] pb-5 text-xs font-black uppercase tracking-[0.2em]">
                  <span>Music Life Studios</span>
                  <span className="bg-[#ff8a00] px-3 py-1 text-black">Artist Built</span>
                  <span>Book Online</span>
                </div>
                <h2 className="mt-10 max-w-3xl text-5xl font-black leading-[0.92] md:text-7xl">
                  Make the studio part of your rhythm.
                </h2>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-black/72">
                  Monthly memberships, bundled savings, and one-on-one sessions with Wiz for artists who want records finished, not folders full of almosts.
                </p>
              </div>

              <div>
                <div className="mt-10 grid grid-cols-1 border-2 border-[#111] bg-[#111] text-white sm:grid-cols-3">
                  {[
                    ["Record", "3-8 hrs/mo"],
                    ["Finish", "Mix + master credits"],
                    ["Save", "Member-only rates"],
                  ].map(([label, value]) => (
                    <div key={label} className="border-b border-white/15 p-4 sm:border-b-0 sm:border-r last:sm:border-r-0">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff8a00]">{label}</p>
                      <p className="mt-2 text-lg font-black">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" className="bg-[#ff8a00] text-black hover:bg-[#ffac3d]">
                    <Link href="/account/register?intent=membership">Join a Membership</Link>
                  </Button>
                  <Button asChild size="lg" className="border-2 border-black bg-transparent text-black hover:bg-black hover:text-white">
                    <Link href="/deals">See Savings</Link>
                  </Button>
                </div>
              </div>
            </div>

            <div className="relative min-h-[440px] border-t-2 border-[#111] bg-[#ff8a00] p-6 text-black md:border-l-2 md:border-t-0 md:p-10">
              <div className="flex h-full flex-col justify-between border-2 border-black bg-[#f3eee4] p-5">
                <div className="flex items-center justify-between gap-4 border-b-2 border-black pb-4">
                  <p className="text-xs font-black uppercase tracking-[0.2em]">Mobile by design</p>
                  <Radio className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-6xl font-black leading-[0.85]">NO ROOM<br />REQUIRED.</p>
                  <p className="mt-5 max-w-xs text-sm font-semibold">Bring the work. Build the record. Keep your Music Lifer Passport moving.</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs font-black uppercase tracking-[0.12em]">
                  <div className="border-2 border-black bg-black p-3 text-[#ff8a00]">Record</div>
                  <div className="border-2 border-black p-3">Finish</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="border-2 border-[#111] bg-[#111] p-6 text-white">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff8a00]">Tone</p>
            <p className="mt-4 text-3xl font-black leading-tight">More personal. More music. Less corporate polish.</p>
            <p className="mt-4 text-white/68">
              This direction uses bigger contrast, plainspoken copy, flyer-style blocks, and sharper edges.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {MEMBERSHIP_PLAN_CATALOG.map((plan) => (
              <div key={plan.tier} className="border-2 border-[#111] bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff8a00]">Monthly</p>
                <h3 className="mt-2 text-xl font-black leading-tight">{plan.name}</h3>
                <p className="mt-4 text-3xl font-black">{formatCents(plan.monthlyPriceCents)}</p>
                <p className="mt-3 text-sm text-black/65">{plan.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function LiferPassportConcept() {
  return (
    <section className="bg-[#111] py-16 text-white md:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <PreviewLabel>Music Lifer Passport V2</PreviewLabel>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#ff8a00]">Concept Direction</p>
            <h2 className="mt-4 text-5xl font-black leading-[0.95] md:text-6xl">
              You are not just booking studio time. You are becoming a Music Lifer.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
              Simpler idea: the pass shows your level, the benefits show what you get now, and the stamps show progress toward future rewards.
            </p>
            <div className="mt-8 space-y-3">
              {[
                ["1", "Pick your path", "Free Music Lifer account, bundle, or Passport Program membership."],
                ["2", "Use your value", "Hours, credits, priority, and savings stay visible."],
                ["3", "Earn stamps", "Sessions earn stamps. Passport members reach the reward in 3 paid months."],
              ].map(([step, label, copy]) => (
                <div key={label} className="grid grid-cols-[3rem_1fr] gap-4 border border-white/15 bg-white/[0.04] p-4">
                  <div className="grid h-12 w-12 place-items-center bg-[#ff8a00] text-xl font-black text-black">{step}</div>
                  <div>
                    <p className="text-xl font-black">{label}</p>
                    <p className="mt-1 text-sm text-white/58">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#f3eee4] p-4 text-[#111] shadow-[12px_12px_0_#ff8a00]">
            <div className="border-2 border-[#111] bg-[#f8f1e4]">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-[#111]">
                <div className="p-5">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-[#ff8a00]">Passport No. MLS-001</p>
                  <h3 className="mt-2 text-4xl font-black leading-none">Music Lifer</h3>
                </div>
                <div className="m-5 grid h-16 w-16 place-items-center border-2 border-[#111] bg-[#ff8a00]">
                  <Disc3 className="h-9 w-9" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[0.95fr_1.05fr]">
                <div className="border-b-2 border-[#111] p-5 md:border-b-0 md:border-r-2">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff8a00]">Current Pass</p>
                  <p className="mt-2 text-3xl font-black leading-tight">Release Artist</p>
                  <p className="mt-1 text-sm text-black/60">Music Lifer monthly access</p>
                  <div className="mt-5 border-2 border-[#111] bg-[#111] p-4 text-white">
                    <Mic2 className="h-7 w-7 text-[#ff8a00]" />
                    <p className="mt-5 text-sm text-white/60">This month includes</p>
                    <p className="mt-1 text-2xl font-black">8 studio hours</p>
                    <p className="text-sm text-white/60">plus finishing credits</p>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff8a00]">Passport Stamps</p>
                  <p className="mt-2 text-sm text-black/60">One successful monthly payment earns one stamp.</p>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {["Paid Month 1", "Paid Month 2", "Paid Month 3"].map((stamp, index) => (
                      <div
                        key={stamp}
                        className={`grid aspect-square place-items-center border-2 border-dashed border-[#111] p-2 text-center ${index < 2 ? "bg-white" : "bg-[#f3eee4]"}`}
                      >
                        <div>
                          {index < 2 && <Stamp className="mx-auto mb-1 h-5 w-5 text-[#ff8a00]" />}
                          <p className="text-xs font-black leading-tight">{stamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 bg-[#ff8a00] p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-black/70">Passport Reward</p>
                    <p className="mt-1 text-xl font-black">1 paid month away from 2 studio hours + a beat lease</p>
                    <p className="mt-2 text-sm font-semibold text-black/70">2 of 3 Passport stamps earned</p>
                  </div>
                </div>
              </div>

              <div className="border-t-2 border-[#111] bg-white p-5">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff8a00]">Clear Meaning</p>
                <p className="mt-3 text-2xl font-black leading-tight">
                  Free Music Lifers reach the reward in 5 completed sessions. Passport members reach it in 3 paid months.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {[
            ["General Entry", "Single Session", "Book once and experience the room.", "/booking"],
            ["Bundle Pass", "Prepaid Savings", "Buy more time up front and keep moving.", "/deals"],
            ["Music Lifer", "Monthly Passport", "Make the studio part of your month.", "/account/register?intent=membership"],
          ].map(([tier, title, copy, href], index) => (
            <div
              key={tier}
              className={`relative overflow-hidden border-2 p-5 ${
                index === 2 ? "border-[#ff8a00] bg-[#ff8a00] text-black" : "border-white/18 bg-white/[0.04]"
              }`}
            >
              <div className={`absolute -right-6 top-5 h-10 w-20 rotate-12 ${index === 2 ? "bg-black/12" : "bg-[#ff8a00]/20"}`} />
              <p className={`text-xs font-black uppercase tracking-[0.2em] ${index === 2 ? "text-black/70" : "text-[#ff8a00]"}`}>{tier}</p>
              <h3 className="mt-3 text-2xl font-black">{title}</h3>
              <p className={`mt-3 text-sm ${index === 2 ? "text-black/70" : "text-white/65"}`}>{copy}</p>
              <Button
                asChild
                className={`mt-5 w-full ${index === 2 ? "bg-black text-white hover:bg-black/85" : "bg-white text-black hover:bg-[#f3eee4]"}`}
              >
                <Link href={href}>{index === 2 ? "Become a Music Lifer" : "Compare Options"}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RateSheetPreview() {
  return (
    <section className="bg-[#151515] py-16 text-white">
      <div className="mx-auto max-w-6xl px-6">
        <PreviewLabel>Deals Page Direction</PreviewLabel>
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="text-4xl font-black">Studio Rate Sheet</h2>
            <p className="mt-2 max-w-2xl text-white/70">A less corporate way to show savings: clear prices, visible bundle value, no hourly-rate giveaway.</p>
          </div>
          <Button asChild className="bg-[#ff8a00] text-black hover:bg-[#ffac3d]">
            <Link href="/deals">Open Current Deals Page</Link>
          </Button>
        </div>
        <div className="overflow-hidden border border-white/15">
          <div className="grid grid-cols-4 bg-[#ff8a00] px-4 py-3 text-sm font-black text-black">
            <span>Package</span>
            <span>Standard</span>
            <span>Bundle</span>
            <span>Savings</span>
          </div>
          {bundleRows.map((row, index) => (
            <div key={row[0]} className={`grid grid-cols-4 px-4 py-4 text-sm ${index % 2 ? "bg-white/[0.04]" : "bg-black/30"}`}>
              {row.map((cell) => <span key={cell}>{cell}</span>)}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MembershipPassPreview() {
  return (
    <section className="bg-[#f3eee4] py-16 text-[#101010]">
      <div className="mx-auto max-w-6xl px-6">
        <PreviewLabel>Passport Program Direction</PreviewLabel>
        <h2 className="text-4xl font-black">Memberships as artist passports.</h2>
        <p className="mt-3 max-w-2xl text-lg text-black/65">
          Every Passport tier earns its reward faster than the free five-session path, with stronger benefits at higher levels.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {MEMBERSHIP_PLAN_CATALOG.map((plan, index) => (
            <div key={plan.tier} className="overflow-hidden border-2 border-black bg-white">
              <img src={passportArtwork[index][0]} alt={passportArtwork[index][1]} className="h-40 w-full object-cover" />
              <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff8a00]">Artist Pass</p>
                  <h3 className="mt-2 text-2xl font-black">{plan.name}</h3>
                </div>
                <Disc3 className="h-8 w-8" />
              </div>
              <p className="mt-5 text-4xl font-black">{formatCents(plan.monthlyPriceCents)}</p>
              <p className="text-sm text-black/60">month-to-month</p>
              <div className="mt-5 border-2 border-black bg-[#f3eee4] p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff8a00]">{passportRewards[index].name}</p>
                <p className="mt-2 text-sm font-bold">Reward unlocks after {passportRewards[index].unlock}</p>
                <p className="mt-2 text-lg font-black leading-tight">{passportRewards[index].reward}</p>
              </div>
              <div className="mt-5 space-y-2 text-sm">
                {plan.benefits.slice(0, 5).map((benefit) => (
                  <div key={benefit} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#ff8a00]" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ToolPreview() {
  return (
    <section className="bg-[#101010] py-16 text-white">
      <div className="mx-auto max-w-6xl px-6">
        <PreviewLabel>Account/Admin Direction</PreviewLabel>
        <h2 className="text-4xl font-black">Functional pages can still feel like Music Life.</h2>
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          {[
            { icon: CalendarDays, title: "Upcoming Sessions", value: "3 booked", note: "Next: Fri 7:00 PM" },
            { icon: Radio, title: "Membership Status", value: "Release Artist", note: "Paid through Sep 6" },
            { icon: SlidersHorizontal, title: "Benefit Ledger", value: "8 hours", note: "3 Quick Finish credits" },
          ].map((item) => (
            <div key={item.title} className="border border-white/15 bg-white/[0.04] p-5">
              <item.icon className="h-6 w-6 text-[#ff8a00]" />
              <p className="mt-5 text-sm text-white/55">{item.title}</p>
              <p className="mt-1 text-2xl font-black">{item.value}</p>
              <p className="mt-2 text-sm text-white/65">{item.note}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 border border-white/15 bg-black/40 p-5">
          <div className="flex items-center gap-3">
            <ReceiptText className="h-5 w-5 text-[#ff8a00]" />
            <p className="font-bold">Ledger history, payments, and admin controls stay quiet and scannable.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function VisualTokens() {
  return (
    <section className="bg-white py-16 text-[#101010]">
      <div className="mx-auto max-w-6xl px-6">
        <PreviewLabel>Visual System</PreviewLabel>
        <h2 className="text-4xl font-black">Colors, surfaces, and texture.</h2>
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-4">
          {[
            ["Near Black", dark],
            ["Ink", ink],
            ["Studio Gold", gold],
            ["Warm Paper", paper],
          ].map(([name, color]) => (
            <div key={name} className="border border-black/15 p-4">
              <div className="h-24 border border-black/10" style={{ backgroundColor: color }} />
              <p className="mt-3 font-bold">{name}</p>
              <p className="text-sm text-black/55">{color}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button className="bg-[#ff8a00] text-black hover:bg-[#ffac3d]">Primary CTA</Button>
          <Button className="bg-black text-white hover:bg-black/85">Dark CTA</Button>
          <Button variant="outline" className="border-black text-black hover:bg-black hover:text-white">Outline CTA</Button>
        </div>
      </div>
    </section>
  );
}

export default function DesignPreview() {
  return (
    <>
      <Helmet>
        <title>Design Preview | Music Life Studios</title>
      </Helmet>
      <div className="bg-white">
        <section className="bg-black px-6 py-6 text-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#ff8a00]">Private Preview</p>
              <h1 className="mt-2 text-3xl font-black">Music Life redesign directions</h1>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline" className="border-white bg-transparent text-white hover:bg-white hover:text-black">
                <Link href="/">Current Home</Link>
              </Button>
              <Button asChild className="bg-[#ff8a00] text-black hover:bg-[#ffac3d]">
                <Link href="/deals">Current Deals</Link>
              </Button>
            </div>
          </div>
        </section>
        <AttemptTwo />
        <LiferPassportConcept />
        <HeroA />
        <HeroB />
        <HeroC />
        <VisualTokens />
        <RateSheetPreview />
        <MembershipPassPreview />
        <ToolPreview />
        <section className="bg-[#ff8a00] px-6 py-12 text-black">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-black">Pick what feels like Wiz.</h2>
              <p className="mt-1 text-black/70">We can mix parts from these directions before touching the live site.</p>
            </div>
            <div className="flex items-center gap-2 font-black">
              Next: choose hero, deals, and membership card treatments <ArrowRight className="h-5 w-5" />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
