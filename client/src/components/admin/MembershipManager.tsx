import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { MembershipPlan, MembershipSubscription } from "@shared/schema";

type AdminMembershipRow = {
  subscription: MembershipSubscription;
  user: {
    id: number;
    username: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  plan: MembershipPlan | null;
  ledger: Array<{
    id: number;
    benefitDefinitionId: number;
    action: string;
    quantity: number;
    balanceBefore: number;
    balanceAfter: number;
    notes: string | null;
    createdAt: string | Date;
  }>;
  events: Array<{
    id: number;
    eventType: string;
    details: string;
    createdAt: string | Date;
  }>;
};

export default function MembershipManager() {
  const { toast } = useToast();
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string>("");
  const [benefitDefinitionId, setBenefitDefinitionId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");

  const { data: memberships = [], isLoading } = useQuery<AdminMembershipRow[]>({
    queryKey: ["/api/admin/memberships"],
  });

  const activateMutation = useMutation({
    mutationFn: async (subscriptionId: number) => {
      const response = await apiRequest("POST", `/api/admin/memberships/${subscriptionId}/activate`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/memberships"] });
      toast({ title: "Membership activated", description: "Initial benefits were issued to the ledger." });
    },
    onError: (error: Error) => {
      toast({ title: "Activation failed", description: error.message, variant: "destructive" });
    },
  });

  const adjustMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/admin/memberships/${selectedSubscriptionId}/adjust-benefit`, {
        benefitDefinitionId: Number(benefitDefinitionId),
        quantity: Number(quantity),
        reason,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/memberships"] });
      setReason("");
      toast({ title: "Benefit adjusted", description: "The adjustment was written to the membership ledger." });
    },
    onError: (error: Error) => {
      toast({ title: "Adjustment failed", description: error.message, variant: "destructive" });
    },
  });

  const selectedMembership = memberships.find((item) => item.subscription.id.toString() === selectedSubscriptionId);
  const benefitOptions = selectedMembership
    ? Array.from(new Map(selectedMembership.ledger.map((entry) => [entry.benefitDefinitionId, entry])).values())
    : [];

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(date));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount / 100);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">Loading memberships...</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Memberships</CardTitle>
          <CardDescription>Review enrollment, status, paid-through dates, and ledger activity.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Next Billing</TableHead>
                <TableHead>Paid Through</TableHead>
                <TableHead>Ledger Entries</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberships.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No membership enrollments yet.
                  </TableCell>
                </TableRow>
              ) : memberships.map((item) => (
                <TableRow key={item.subscription.id}>
                  <TableCell>
                    <div className="font-medium">{item.user?.firstName || item.user?.username || "Unknown"}</div>
                    <div className="text-xs text-muted-foreground">{item.user?.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{item.plan?.name || "Unknown plan"}</div>
                    {item.plan && <div className="text-xs text-muted-foreground">{formatCurrency(item.plan.priceCents)} / month</div>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.subscription.status === "active" ? "default" : "secondary"}>
                      {item.subscription.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(item.subscription.nextBillingDate)}</TableCell>
                  <TableCell>{formatDate(item.subscription.paidThroughDate)}</TableCell>
                  <TableCell>{item.ledger.length}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {item.subscription.status === "pending_payment" && (
                        <Button size="sm" onClick={() => activateMutation.mutate(item.subscription.id)} disabled={activateMutation.isPending}>
                          Activate
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => setSelectedSubscriptionId(item.subscription.id.toString())}>
                        Adjust
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manual Benefit Adjustment</CardTitle>
          <CardDescription>Use only for documented corrections, rewards, expirations, or support fixes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Membership</Label>
              <Select value={selectedSubscriptionId} onValueChange={setSelectedSubscriptionId}>
                <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                <SelectContent>
                  {memberships.map((item) => (
                    <SelectItem key={item.subscription.id} value={item.subscription.id.toString()}>
                      {item.user?.email || `Subscription ${item.subscription.id}`} - {item.plan?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Benefit</Label>
              <Select value={benefitDefinitionId} onValueChange={setBenefitDefinitionId} disabled={!selectedMembership}>
                <SelectTrigger><SelectValue placeholder="Select benefit" /></SelectTrigger>
                <SelectContent>
                  {benefitOptions.map((entry) => (
                    <SelectItem key={entry.benefitDefinitionId} value={entry.benefitDefinitionId.toString()}>
                      Benefit #{entry.benefitDefinitionId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input value={quantity} onChange={(event) => setQuantity(event.target.value)} type="number" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Document the reason for this adjustment" />
          </div>
          <Button
            onClick={() => adjustMutation.mutate()}
            disabled={!selectedSubscriptionId || !benefitDefinitionId || !quantity || !reason || adjustMutation.isPending}
          >
            Write Ledger Adjustment
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
