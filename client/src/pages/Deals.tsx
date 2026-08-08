import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { Check, Clock, Gift, Music, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MEMBERSHIP_PLAN_CATALOG, formatCents } from "@shared/membership";
import { useAuth } from "@/hooks/use-auth";

const passportLevels = [
  ["Passport Starter", "3 paid months", "2 studio hours + 1 beat lease", "/assets/lifer-passport-starter.png", "Music Lifer Passport emblem"],
  ["Passport Builder", "2 paid months", "3 studio hours + 1 beat lease + Quick Finish discount", "/assets/lifer-passport-builder.png", "Music Lifer Passport sound emblem"],
  ["Passport Release", "2 paid months", "3 studio hours + 2 beat leases + larger service discount", "/assets/lifer-passport-release.png", "Music Lifer Passport release emblem"],
];

const passportFrameClasses = [
  "border-[#8a5a1c] shadow-[8px_8px_0_#6d4918]",
  "border-[#b06b18] shadow-[8px_8px_0_#b06b18]",
  "border-[#ff8a00] shadow-[8px_8px_0_#ff8a00]",
];

const bundleGroups = [
  {
    title: "Recording Blocks",
    subtitle: "Buy focused studio time and save once you reach 4 hours.",
    unit: "hours",
    rows: [
      ["2", "$100", "$100", "$0"],
      ["4", "$200", "$180", "$20"],
      ["6", "$300", "$260", "$40"],
      ["8", "$400", "$340", "$60"],
    ],
    note: "More than 8 hours routes to an EP, album, full-day, or custom project quote.",
  },
  {
    title: "Release-Ready Songs",
    subtitle: "Recording, vocal cleanup, mix, master, delivery, and one revision per song.",
    unit: "songs",
    rows: [
      ["1", "$225", "$225", "$0"],
      ["2", "$450", "$425", "$25"],
      ["3", "$675", "$600", "$75"],
      ["4", "$900", "$780", "$120"],
      ["5", "$1,125", "$950", "$175"],
    ],
    note: "More than 5 songs routes to an EP or album package quote.",
  },
  {
    title: "Quick Finish",
    subtitle: "Fast finishing for eligible Music Life sessions and organized files.",
    unit: "songs",
    rows: [
      ["1", "$75", "$75", "$0"],
      ["2", "$150", "$140", "$10"],
      ["3", "$225", "$200", "$25"],
      ["4", "$300", "$250", "$50"],
      ["5", "$375", "$300", "$75"],
    ],
    note: "Final eligibility is confirmed after session or file review.",
  },
  {
    title: "Mix and Master",
    subtitle: "Standard and Advanced bundles for artists finishing multiple records.",
    unit: "songs",
    rows: [
      ["Standard 1", "$125", "$125", "$0"],
      ["Standard 3", "$375", "$345", "$30"],
      ["Standard 5", "$625", "$525", "$100"],
      ["Advanced 3", "$525", "$495", "$30"],
      ["Advanced 5", "$875", "$775", "$100"],
    ],
    note: "Advanced prices are starting prices and final scope is confirmed after file review.",
  },
  {
    title: "Master Only",
    subtitle: "Mastering savings start at 4 songs for balanced, mix-ready stereo files.",
    unit: "songs",
    rows: [
      ["1", "$50", "$50", "$0"],
      ["3", "$150", "$150", "$0"],
      ["4", "$200", "$180", "$20"],
      ["6", "$300", "$255", "$45"],
      ["8", "$400", "$330", "$70"],
    ],
    note: "More than 8 songs routes to an EP or album mastering quote.",
  },
  {
    title: "Custom Production",
    subtitle: "Bundle savings for custom beats and complete single packages.",
    unit: "projects",
    rows: [
      ["2 beats", "$400", "$380", "$20"],
      ["4 beats", "$800", "$700", "$100"],
      ["2 complete singles", "$650", "$625", "$25"],
      ["4 complete singles", "$1,300", "$1,160", "$140"],
      ["4 signature singles", "$1,800", "$1,640", "$160"],
    ],
    note: "Full rights, work-for-hire, media use, and larger projects require custom review.",
  },
];

export default function Deals() {
  const { user } = useAuth();
  const membershipHref = user ? "/account?tab=membership" : "/account/register?intent=membership";

  return (
    <>
      <Helmet>
        <title>Deals, Bundles & Memberships | Music Life Studios</title>
        <meta name="description" content="Compare Music Life Studios bundle savings, membership plans, and loyalty rewards." />
      </Helmet>

      <section className="bg-[#1A1A1A] text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <p className="uppercase tracking-[0.2em] text-sm text-[#FF8C00] font-semibold mb-3">Deals & Savings</p>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Save by building consistently.</h1>
            <p className="text-lg md:text-xl text-white/80 max-w-3xl">
              Compare bundle discounts, monthly memberships, prepaid savings, and loyalty rewards before you book.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" className="bg-[#FF8C00] hover:bg-[#FFA333] text-[#1A1A1A]">
                <Link href={membershipHref}>Join a Membership</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white bg-transparent text-white hover:bg-white hover:text-black">
                <Link href="/booking">Book a Session</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#141414] py-12 text-white">
        <div className="container mx-auto px-4 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="rounded-none border-2 border-[#6d4918] bg-[#1d1d1d] text-white shadow-none">
              <CardHeader>
                <Tag className="mb-2 h-6 w-6 text-[#ff8a00]" />
                <CardTitle>Bundle Savings</CardTitle>
                <CardDescription>Buy more time, songs, or production work in one order and lower the effective rate.</CardDescription>
              </CardHeader>
            </Card>
            <Card className="rounded-none border-2 border-[#6d4918] bg-[#1d1d1d] text-white shadow-none">
              <CardHeader>
                <Music className="mb-2 h-6 w-6 text-[#ff8a00]" />
                <CardTitle>Monthly Memberships</CardTitle>
                <CardDescription>Predictable studio access, finishing credits, member discounts, and priority booking.</CardDescription>
              </CardHeader>
            </Card>
            <Card className="rounded-none border-2 border-[#6d4918] bg-[#1d1d1d] text-white shadow-none">
              <CardHeader>
                <Gift className="mb-2 h-6 w-6 text-[#ff8a00]" />
                <CardTitle>Loyalty Rewards</CardTitle>
                <CardDescription>Keep coming back and earn rewards without a long-term commitment.</CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div>
            <h2 className="mb-4 text-3xl font-black">Passport Program</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {MEMBERSHIP_PLAN_CATALOG.map((plan, index) => (
                <Card key={plan.tier} className={`overflow-hidden rounded-none border-2 bg-[#1d1d1d] text-white shadow-none ${passportFrameClasses[index]}`}>
                  <div className="relative h-44 overflow-hidden border-b-2 border-[#8a5a1c] bg-black">
                    <img src={passportLevels[index][3]} alt={passportLevels[index][4]} className="h-full w-full object-cover brightness-[0.82] contrast-[1.15]" />
                    <div className="absolute inset-0 bg-black/25" />
                    <p className="absolute bottom-3 left-4 text-xs font-black uppercase tracking-[0.2em] text-[#ffb84d]">Passport {String(index + 1).padStart(2, "0")}</p>
                  </div>
                  <CardHeader>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff8a00]">{passportLevels[index][0]}</p>
                    <CardTitle className="mt-2 text-2xl font-black">{plan.name}</CardTitle>
                    <CardDescription className="text-white/65">{plan.bestFor}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-3xl font-black">{formatCents(plan.monthlyPriceCents)}</p>
                      <p className="text-sm text-white/55">per month</p>
                      <p className="mt-1 text-sm text-white/55">
                        Optional prepaid: {formatCents(plan.prepaidThreeMonthPriceCents)} for 3 months
                      </p>
                    </div>
                    <div className="border-2 border-[#8a5a1c] bg-[#2a2115] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ffb84d]">Reward after {passportLevels[index][1]}</p>
                      <p className="mt-2 font-black leading-tight text-white">{passportLevels[index][2]}</p>
                    </div>
                    <ul className="space-y-2 text-sm">
                      {plan.benefits.slice(0, 7).map((benefit) => (
                        <li key={benefit} className="flex gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#ff8a00]" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                    <Button asChild className="w-full bg-[#ff8a00] text-black hover:bg-[#ffac3d]">
                      <Link href={membershipHref}>Start Enrollment</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold mb-4">Bundle Price Tables</h2>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {bundleGroups.map((group) => (
                <Card key={group.title} className="rounded-none border-2 border-[#6d4918] bg-[#1d1d1d] text-white shadow-none">
                  <CardHeader>
                    <CardTitle>{group.title}</CardTitle>
                    <CardDescription className="text-white/65">{group.subtitle}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{group.unit}</TableHead>
                          <TableHead>Standard</TableHead>
                          <TableHead>Bundle</TableHead>
                          <TableHead>Savings</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.rows.map((row) => (
                          <TableRow key={`${group.title}-${row[0]}`}>
                            {row.map((cell) => <TableCell key={cell}>{cell}</TableCell>)}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <p className="mt-4 text-sm text-white/55">{group.note}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="rounded-none border-2 border-black bg-[#141414] text-white shadow-none">
            <CardHeader>
              <Clock className="mb-2 h-6 w-6 text-[#ff8a00]" />
              <CardTitle className="text-white">Music Lifer Loyalty</CardTitle>
              <CardDescription className="text-white/65">Reward consistency without forcing a membership commitment.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white/[0.06] p-4">
                <h3 className="mb-2 font-semibold">Free Music Lifer</h3>
                <p className="text-white/65">Five eligible completed sessions earn 2 studio hours plus 1 beat lease.</p>
              </div>
              <div className="bg-white/[0.06] p-4">
                <h3 className="mb-2 font-semibold">Passport stamps</h3>
                <p className="text-white/65">Successful monthly payments earn stamps. Higher Passport tiers reach better rewards faster.</p>
              </div>
              <div className="bg-white/[0.06] p-4">
                <h3 className="mb-2 font-semibold">No pressure</h3>
                <p className="text-white/65">Passport memberships are month-to-month and can be canceled before the next billing date.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
