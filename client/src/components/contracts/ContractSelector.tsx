import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { Contract } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface ContractSelectorProps {
  entityType: string; // e.g., "beat", "booking"
  entityId?: number;
  onContractSelect: (contractId: number) => void;
  preSelectedContractId?: number;
  category?: string;
}

export function ContractSelector({
  entityType,
  entityId,
  onContractSelect,
  preSelectedContractId,
  category
}: ContractSelectorProps) {
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContractId, setSelectedContractId] = useState<number | null>(
    preSelectedContractId || null
  );
  const { toast } = useToast();

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        setLoading(true);
        
        // Construct the query URL
        let url = '/api/contracts';
        if (category) {
          url += `?category=${category}`;
        }
        
        const response = await apiRequest("GET", url);
        if (!response.ok) {
          throw new Error("Failed to fetch contracts");
        }
        
        const data = await response.json();
        setContracts(data);
        
        // If preSelectedContractId is not provided but there's only one contract, select it
        if (!preSelectedContractId && data.length === 1) {
          setSelectedContractId(data[0].id);
          onContractSelect(data[0].id);
        }
      } catch (error) {
        console.error("Error fetching contracts:", error);
        toast({
          title: "Error",
          description: "Failed to load contracts. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, [category, preSelectedContractId, onContractSelect, toast]);

  const handleContractChange = (value: string) => {
    const contractId = parseInt(value);
    setSelectedContractId(contractId);
    onContractSelect(contractId);
  };

  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Select Contract</h3>
            <Select
              value={selectedContractId?.toString() || ""}
              onValueChange={handleContractChange}
              disabled={loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a contract..." />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Available Contracts</SelectLabel>
                  {contracts.map((contract) => (
                    <SelectItem key={contract.id} value={contract.id.toString()}>
                      {contract.title}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {selectedContractId && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/admin/contracts/${selectedContractId}`, '_blank')}
              >
                View Contract
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
