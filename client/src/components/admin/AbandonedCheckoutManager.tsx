import { useMutation, useQuery } from "@tanstack/react-query";
import type { Beat, BeatPurchase } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const recoveryStatuses = new Set(["pending", "recovery_pending", "recovery_sent", "abandoned", "checkout_failed"]);

export default function AbandonedCheckoutManager() {
  const { toast } = useToast();
  const { data: purchases = [], isLoading } = useQuery<BeatPurchase[]>({ queryKey: ["/api/beat-purchases"] });
  const { data: beats = [] } = useQuery<Beat[]>({ queryKey: ["/api/beats"] });
  const beatNames = new Map(beats.map((beat) => [beat.id, beat.title]));
  const rows = purchases.filter((purchase) => recoveryStatuses.has(purchase.licenseStatus));
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/beat-purchases/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/beat-purchases"] });
      toast({ title: "Checkout attempt removed" });
    },
    onError: (error: Error) => toast({ title: "Unable to remove checkout", description: error.message, variant: "destructive" }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Abandoned Checkouts</CardTitle>
        <CardDescription>Unpaid beat-license attempts are hidden from customers. After 24 hours, one 5% recovery checkout is emailed automatically.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-sm text-muted-foreground">Loading checkout activity…</p> : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No abandoned beat checkouts.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Customer</TableHead><TableHead>Beat</TableHead><TableHead>License</TableHead>
                <TableHead>Price</TableHead><TableHead>Started</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>{rows.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell><div className="font-medium">{purchase.customerName}</div><div className="text-xs text-muted-foreground">{purchase.customerEmail}</div></TableCell>
                  <TableCell>{beatNames.get(purchase.beatId) || `Beat #${purchase.beatId}`}</TableCell>
                  <TableCell className="capitalize">{purchase.licenseType}</TableCell>
                  <TableCell>${(purchase.price / 100).toFixed(2)}</TableCell>
                  <TableCell>{new Date(purchase.purchaseDate).toLocaleString()}</TableCell>
                  <TableCell><Badge variant="secondary">{purchase.licenseStatus.replaceAll("_", " ")}</Badge></TableCell>
                  <TableCell><Button variant="outline" size="sm" disabled={deleteMutation.isPending} onClick={() => {
                    if (window.confirm(`Delete this unpaid ${beatNames.get(purchase.beatId) || "beat"} checkout attempt?`)) deleteMutation.mutate(purchase.id);
                  }}>Delete</Button></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
