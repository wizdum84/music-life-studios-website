import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { scrollToTop } from "@/lib/utils";
import { Contract } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SignatureCanvas } from "@/components/forms/SignatureCanvas";
import { FileText, Check, AlertCircle, Download, Eye, PenLine } from "lucide-react";

interface ContractRequirementProps {
  contractId: number;
  entityType: string; // e.g., "beat", "booking"
  entityId?: number;
  email: string;
  name: string;
  plainLanguageSummary?: string;
  onContractSigned: () => void;
  onCheckExistingSignature?: boolean;
}

export function ContractRequirement({
  contractId,
  entityType,
  entityId,
  email,
  name,
  plainLanguageSummary,
  onContractSigned,
  onCheckExistingSignature = true,
}: ContractRequirementProps) {
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [signaturePad, setSignaturePad] = useState<string | null>(null);
  const [signatureMode, setSignatureMode] = useState<"draw" | "type">("draw");
  const [typedSignature, setTypedSignature] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contractSigned, setContractSigned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const effectiveSignature = signatureMode === "type" ? typedSignature.trim() : signaturePad;

  const getPlainLanguageSummary = (title: string) => {
    if (plainLanguageSummary?.trim()) return plainLanguageSummary.trim();

    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes("membership") || lowerTitle.includes("passport")) {
      return "You are agreeing to the Passport plan, monthly payment, included benefits, rewards, and cancellation terms shown below.";
    }
    if (lowerTitle.includes("mix") || lowerTitle.includes("master")) {
      return "You are agreeing to the mix/master scope, price, files, revisions, delivery, and payment terms shown below.";
    }
    if (lowerTitle.includes("beat") || lowerTitle.includes("license")) {
      return "You are agreeing to the beat license, permitted uses, rights limits, payment, and delivery terms shown below.";
    }
    return "You are agreeing to the selected service, price, schedule, delivery, payment, and change or cancellation terms shown below.";
  };

  const getReviewTargets = () => [
    { id: "payment", label: "Payment", pattern: /payment|deposit|price|fee|billing/i },
    { id: "delivery", label: "Deliverables & revisions", pattern: /deliver|included|revision|file|format/i },
    { id: "cancellation", label: "Cancellation", pattern: /cancel|reschedul|refund|no-show/i },
    { id: "rights", label: "Rights & ownership", pattern: /right|license|ownership|content id|portfolio/i },
    { id: "signature", label: "Electronic signature", pattern: /electronic|signature|sign/i },
  ];

  const downloadContractCopy = () => {
    if (!contract) return;
    const content = `${contract.title}\n\n${contract.content || contract.description}`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${contract.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "music-life-agreement"}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

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
              `/api/verify-entity-contract-signed?entityType=${entityType}&entityId=${entityId}&email=${email}`
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
          throw new Error(`Failed to fetch contract with ID ${contractId}`);
        }
        
        const data = await response.json();
        console.log(`Contract ${contractId} loaded successfully:`, data);
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
    if (!contract || !effectiveSignature || !agreedToTerms) {
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
      
      const response = await apiRequest("POST", "/api/contract-signatures", {
        contractId: contract.id,
        customerName: name,
        customerEmail: email,
        signatureData: effectiveSignature,
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
      
      // Scroll to top before calling onContractSigned
      scrollToTop();
      
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

  const contractText = contract.content || contract.description;
  const reviewTargets = getReviewTargets();
  const claimedTargetIds = new Set<string>();
  const lineAnchorIds = new Map<number, string>();
  contractText.split("\n").forEach((line, index) => {
    const target = reviewTargets.find((candidate) => !claimedTargetIds.has(candidate.id) && candidate.pattern.test(line));
    if (target) {
      claimedTargetIds.add(target.id);
      lineAnchorIds.set(index, `contract-section-${target.id}`);
    }
  });
  const availableReviewTargets = reviewTargets.filter((target) => claimedTargetIds.has(target.id));
  const isAgreementHeading = (line: string) => {
    const trimmed = line.trim();
    return Boolean(trimmed) && (
      /^[A-Z0-9][A-Z0-9 ,&/.'-]{8,}$/.test(trimmed) ||
      trimmed.endsWith("MANUAL REVIEW REQUIRED")
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-muted/30 p-6 rounded-lg border">
        <div className="flex items-center mb-4">
          <FileText className="w-6 h-6 text-primary mr-2" />
          <h3 className="text-lg font-semibold">{contract.title}</h3>
        </div>

        <div className="rounded-md border-2 border-primary bg-primary/10 p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-5 w-5 text-primary" />
            <h4 className="font-bold">Plain-language summary before you sign</h4>
          </div>
          <p className="text-base font-bold leading-7">{getPlainLanguageSummary(contract.title)}</p>
          <p className="mt-2 text-xs font-medium text-muted-foreground">This is only a convenience summary. Read the full agreement below; the full agreement controls.</p>
          {availableReviewTargets.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold">
              <span className="text-muted-foreground">Review:</span>
              {availableReviewTargets.map((target) => (
                <a
                  key={target.id}
                  href={`#contract-section-${target.id}`}
                  className="text-primary underline underline-offset-2 hover:text-primary/80"
                  onClick={(event) => {
                    event.preventDefault();
                    document.getElementById(`contract-section-${target.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                >
                  {target.label}
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-md border-2 border-amber-500 bg-amber-50 p-4 mb-6 text-amber-950">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <h4 className="font-bold">Important: keep a copy for your records</h4>
              <p className="mt-1 text-sm leading-6">Review the full agreement carefully, download a copy, and save it somewhere you can access later before signing.</p>
              <Button type="button" variant="outline" size="sm" className="mt-3 border-red-600 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={downloadContractCopy}>
                <Download className="mr-2 h-4 w-4" />
                Download a Copy
              </Button>
            </div>
          </div>
        </div>
        
        <div className="mb-6 min-h-[28rem] max-h-[min(68vh,46rem)] overflow-y-auto p-5 md:p-7 bg-background border rounded-md">
          <h4 className="font-medium mb-4">Full agreement</h4>
          <div className="text-[15px] md:text-base font-sans leading-7 mb-4">
            {contractText.split("\n").map((line, index) => {
              const trimmed = line.trim();
              const anchorId = lineAnchorIds.get(index);
              const anchorClass = anchorId ? "scroll-mt-8 border-l-2 border-primary/60 bg-primary/5 px-3 py-1" : "";

              if (!trimmed) {
                return <div key={`${index}-blank`} className="h-3" aria-hidden="true" />;
              }

              if (isAgreementHeading(trimmed)) {
                return (
                  <h5 key={`${index}-${trimmed.slice(0, 12)}`} id={anchorId} className={`mt-7 first:mt-0 border-b border-border pb-2 text-sm font-bold uppercase tracking-wide text-foreground ${anchorClass}`}>
                    {trimmed}
                  </h5>
                );
              }

              if (trimmed.startsWith("-")) {
                return (
                  <div key={`${index}-${trimmed.slice(0, 12)}`} id={anchorId} className={`flex gap-3 pl-4 ${anchorClass}`}>
                    <span className="text-primary" aria-hidden="true">•</span>
                    <span>{trimmed.slice(1).trim()}</span>
                  </div>
                );
              }

              return (
                <p key={`${index}-${trimmed.slice(0, 12)}`} id={anchorId} className={`mb-3 last:mb-0 ${anchorClass}`}>
                  {trimmed}
                </p>
              );
            })}
          </div>
          
          {contract.fileType === "pdf" && contract.fileUrl && (
            <div className="flex flex-col items-center justify-center border-t pt-4">
              <a 
                href={contract.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center"
              >
                <FileText className="w-4 h-4 mr-1" />
                View Full Contract Document
              </a>
              <span className="text-xs text-muted-foreground mt-1">
                (Opens in a new window)
              </span>
            </div>
          )}
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
          
          <div className="space-y-3">
            <Label>Signature</Label>
            <div className="inline-flex rounded-md border bg-background p-1">
              <Button type="button" size="sm" variant={signatureMode === "draw" ? "default" : "ghost"} onClick={() => setSignatureMode("draw")}>
                <PenLine className="mr-2 h-4 w-4" />
                Draw
              </Button>
              <Button type="button" size="sm" variant={signatureMode === "type" ? "default" : "ghost"} onClick={() => setSignatureMode("type")}>
                <FileText className="mr-2 h-4 w-4" />
                Type
              </Button>
            </div>

            {signatureMode === "draw" ? (
              <>
                <div className="border rounded-md overflow-hidden bg-background">
                  <SignatureCanvas
                    onSignatureChange={setSignaturePad}
                    height={150}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Draw your signature above, or switch to Type to enter it with your keyboard.</p>
              </>
            ) : (
              <>
                <Input
                  aria-label="Typed electronic signature"
                  placeholder="Type your full name"
                  value={typedSignature}
                  onChange={(event) => setTypedSignature(event.target.value)}
                  className="text-2xl italic"
                  style={{ fontFamily: '"Segoe Script", "Brush Script MT", cursive' }}
                />
                <div className="min-h-16 rounded-md border bg-background px-4 py-3 text-3xl italic" style={{ fontFamily: '"Segoe Script", "Brush Script MT", cursive' }}>
                  {typedSignature.trim() || "Your typed signature will appear here"}
                </div>
                <p className="text-xs text-muted-foreground">Typing your name is your electronic signature for this agreement.</p>
              </>
            )}
          </div>
          
          <Button 
            onClick={handleSignContract} 
            disabled={!agreedToTerms || !effectiveSignature || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></span>
                Signing...
              </span>
            ) : (
              "I Agree & Continue"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
