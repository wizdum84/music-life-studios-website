import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { Check, Clock, Gift, Music, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MEMBERSHIP_PLAN_CATALOG, formatCents } from "@shared/membership";
import { useAuth } from "@/hooks/use-auth";

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
              <Button asChild size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-primary">
                <Link href="/booking">Book a Session</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <Tag className="h-6 w-6 text-primary mb-2" />
                <CardTitle>Bundle Savings</CardTitle>
                <CardDescription>Buy more time, songs, or production work in one order and lower the effective rate.</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Music className="h-6 w-6 text-primary mb-2" />
                <CardTitle>Monthly Memberships</CardTitle>
                <CardDescription>Predictable studio access, finishing credits, member discounts, and priority booking.</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Gift className="h-6 w-6 text-primary mb-2" />
                <CardTitle>Loyalty Rewards</CardTitle>
                <CardDescription>Keep coming back and earn rewards without a long-term commitment.</CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div>
            <h2 className="text-3xl font-bold mb-4">Music Life Artist Memberships</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {MEMBERSHIP_PLAN_CATALOG.map((plan) => (
                <Card key={plan.tier}>
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.bestFor}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-3xl font-bold">{formatCents(plan.monthlyPriceCents)}</p>
                      <p className="text-sm text-muted-foreground">per month</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Optional prepaid: {formatCents(plan.prepaidThreeMonthPriceCents)} for 3 months
                      </p>
                    </div>
                    <ul className="space-y-2 text-sm">
                      {plan.benefits.slice(0, 7).map((benefit) => (
                        <li key={benefit} className="flex gap-2">
                          <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                    <Button asChild className="w-full">
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
                <Card key={group.title}>
                  <CardHeader>
                    <CardTitle>{group.title}</CardTitle>
                    <CardDescription>{group.subtitle}</CardDescription>
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
                    <p className="mt-4 text-sm text-muted-foreground">{group.note}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card>
            <CardHeader>
              <Clock className="h-6 w-6 text-primary mb-2" />
              <CardTitle>Loyalty Program</CardTitle>
              <CardDescription>Reward consistency without forcing a commitment.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-muted/50 p-4">
                <h3 className="font-semibold mb-2">Every 5 sessions</h3>
                <p className="text-muted-foreground">The existing account loyalty program tracks completed paid sessions toward a free-session reward.</p>
              </div>
              <div className="bg-muted/50 p-4">
                <h3 className="font-semibold mb-2">Membership milestone</h3>
                <p className="text-muted-foreground">Launch rule: three consecutive paid months earns one bonus recording hour.</p>
              </div>
              <div className="bg-muted/50 p-4">
                <h3 className="font-semibold mb-2">No pressure</h3>
                <p className="text-muted-foreground">Memberships are month-to-month and can be canceled before the next billing date.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
