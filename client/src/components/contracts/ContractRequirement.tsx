import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Contract } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SignatureCanvas } from "@/components/forms/SignatureCanvas";
import { FileText, Check, AlertCircle } from "lucide-react";

interface ContractRequirementProps {
  contractId: number;
  entityType: string; // e.g., "beat", "booking"
  entityId?: number;
  email: string;
  name: string;
  onContractSigned: () => void;
  onCheckExistingSignature?: boolean;
}

export function ContractRequirement({
  contractId,
  entityType,
  entityId,
  email,
  name,
  onContractSigned,
  onCheckExistingSignature = true,
}: ContractRequirementProps) {
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [signaturePad, setSignaturePad] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contractSigned, setContractSigned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchContractData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if contract is already signed (if requested)
        if (onCheckExistingSignature && entityId) {
          try {
            const verifyResponse = await apiRequest(
              "GET", 
              `/api/contracts/verify-signature?entityType=${entityType}&entityId=${entityId}&email=${email}`
            );
            const verifyData = await verifyResponse.json();
            
            if (verifyResponse.ok && verifyData.signed) {
              setContractSigned(true);
              onContractSigned();
              setLoading(false);
              return;
            }
          } catch (verifyError) {
            console.error("Error checking signature status:", verifyError);
            // Continue to show contract even if verification fails
          }
        }
        
        // Fetch contract details
        const response = await apiRequest("GET", `/api/contracts/${contractId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch contract");
        }
        
        const data = await response.json();
        setContract(data);
      } catch (err) {
        console.error("Error fetching contract data:", err);
        setError("Failed to load contract. Please try again later.");
        toast({
          title: "Error",
          description: "Failed to load contract. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (contractId) {
      fetchContractData();
    }
  }, [contractId, email, entityType, entityId, onCheckExistingSignature, onContractSigned, toast]);

  const handleSignContract = async () => {
    if (!contract || !signaturePad || !agreedToTerms) {
      toast({
        title: "Missing information",
        description: "Please agree to the terms and provide a signature.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      const response = await apiRequest("POST", "/api/contracts/sign", {
        contractId: contract.id,
        customerName: name,
        customerEmail: email,
        signatureData: signaturePad,
        agreedToTerms,
        relatedEntityType: entityType,
        relatedEntityId: entityId || null
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to sign contract");
      }

      setContractSigned(true);
      toast({
        title: "Contract signed",
        description: "The contract has been signed successfully.",
        variant: "default"
      });
      onContractSigned();
    } catch (err: any) {
      console.error("Error signing contract:", err);
      setError(err.message || "Failed to sign contract. Please try again.");
      toast({
        title: "Error",
        description: err.message || "Failed to sign contract. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading contract...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Error Loading Contract</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (contractSigned) {
    return (
      <div className="p-6 text-center bg-primary/5 rounded-lg border border-primary/20">
        <Check className="w-12 h-12 text-primary mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Contract Signed</h3>
        <p className="text-muted-foreground">
          You have already agreed to and signed this contract.
        </p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Contract Not Found</h3>
        <p className="text-muted-foreground mb-4">
          The requested contract could not be found. Please contact support for assistance.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-muted/30 p-6 rounded-lg border">
        <div className="flex items-center mb-4">
          <FileText className="w-6 h-6 text-primary mr-2" />
          <h3 className="text-lg font-semibold">{contract.title}</h3>
        </div>
        
        <div className="mb-6 max-h-60 overflow-y-auto p-4 bg-background border rounded-md">
          <pre className="whitespace-pre-wrap text-sm font-sans">
            {contract.content}
          </pre>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-start space-x-2">
            <Checkbox 
              id="terms" 
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I have read and agree to the terms and conditions
              </Label>
              <p className="text-sm text-muted-foreground">
                By checking this box, I agree to be bound by the terms of this agreement.
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="signature">Signature</Label>
            <div className="border rounded-md overflow-hidden bg-background">
              <SignatureCanvas 
                onSignatureChange={setSignaturePad}
                height={150}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Draw your signature above. Click or tap inside the box and drag to sign.
            </p>
          </div>
          
          <Button 
            onClick={handleSignContract} 
            disabled={!agreedToTerms || !signaturePad || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></span>
                Signing...
              </span>
            ) : (
              "Sign and Continue"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
