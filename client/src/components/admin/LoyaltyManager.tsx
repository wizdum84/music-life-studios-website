import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";

type LoyaltyCustomer = {
  id: number;
  username: string;
  email: string;
  name: string;
  stampCount: number;
  stampsInCurrentCycle: number;
  stampsUntilReward: number;
  earnedRewards: number;
  availableRewards: number;
  redeemedRewards: number;
};

export default function LoyaltyManager() {
  const { data: customers = [], isLoading, isError } = useQuery<LoyaltyCustomer[]>({
    queryKey: ["/api/admin/loyalty"],
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Music Lifer Loyalty</CardTitle>
        <CardDescription>
          Free customer rewards are tracked here separately from paid Passport memberships. Every five eligible completed sessions earns one reward.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <p className="py-10 text-center text-destructive">Loyalty information could not be loaded.</p>
        ) : customers.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">No customer accounts yet.</p>
        ) : (
          <>
          <div className="space-y-3 md:hidden">
            {customers.map((customer) => (
              <div key={customer.id} className="rounded-md border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{customer.name}</p>
                    <p className="break-all text-sm text-muted-foreground">{customer.email}</p>
                  </div>
                  <Badge variant={customer.availableRewards > 0 ? "default" : "secondary"}>
                    {customer.availableRewards} available
                  </Badge>
                </div>
                <div className="mt-4 flex justify-between text-sm">
                  <span>{customer.stampCount} total stamps</span>
                  <span>{customer.stampsUntilReward} until reward</span>
                </div>
                <Progress className="mt-2" value={(customer.stampsInCurrentCycle / 5) * 100} />
                <p className="mt-2 text-xs text-muted-foreground">
                  {customer.stampsInCurrentCycle} of 5 in this cycle · {customer.earnedRewards} rewards earned
                </p>
              </div>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Completed-session stamps</TableHead>
                  <TableHead>Next reward</TableHead>
                  <TableHead>Rewards earned</TableHead>
                  <TableHead>Available</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-muted-foreground">{customer.email}</div>
                      <div className="text-xs text-muted-foreground">@{customer.username}</div>
                    </TableCell>
                    <TableCell className="font-semibold">{customer.stampCount}</TableCell>
                    <TableCell className="min-w-52">
                      <div className="mb-2 flex justify-between text-sm">
                        <span>{customer.stampsInCurrentCycle} of 5 stamps</span>
                        <span>{customer.stampsUntilReward} remaining</span>
                      </div>
                      <Progress value={(customer.stampsInCurrentCycle / 5) * 100} />
                    </TableCell>
                    <TableCell>{customer.earnedRewards}</TableCell>
                    <TableCell>
                      <Badge variant={customer.availableRewards > 0 ? "default" : "secondary"}>
                        {customer.availableRewards}
                      </Badge>
                      {customer.redeemedRewards > 0 && (
                        <div className="mt-1 text-xs text-muted-foreground">{customer.redeemedRewards} redeemed</div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
