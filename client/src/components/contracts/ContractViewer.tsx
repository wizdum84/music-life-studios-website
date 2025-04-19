import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Contract } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { AlertCircle, Download, FileText } from "lucide-react";

interface ContractViewerProps {
  contractId: number;
  showDownload?: boolean;
  className?: string;
}

export function ContractViewer({
  contractId,
  showDownload = true,
  className = ""
}: ContractViewerProps) {
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchContract = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiRequest("GET", `/api/contracts/${contractId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch contract details");
        }
        
        const data = await response.json();
        setContract(data);
      } catch (err) {
        console.error("Error fetching contract:", err);
        setError("Failed to load contract. Please try again.");
        toast({
          title: "Error",
          description: "Failed to load contract details",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (contractId) {
      fetchContract();
    }
  }, [contractId, toast]);

  const handleDownload = () => {
    if (!contract) return;
    
    // Create a text file with contract content
    const element = document.createElement("a");
    const file = new Blob([contract.content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${contract.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (loading) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading contract...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-2" />
        <h3 className="text-lg font-medium mb-1">Error Loading Contract</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-2" />
        <h3 className="text-lg font-medium mb-1">Contract Not Found</h3>
        <p className="text-muted-foreground">
          The requested contract could not be found.
        </p>
      </div>
    );
  }

  return (
    <div className={`contract-viewer space-y-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center">
            <FileText className="mr-2 h-5 w-5 text-primary" />
            {contract.title}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {contract.category} • Version {contract.version}
          </p>
        </div>
        
        {showDownload && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex items-center"
          >
            <Download className="mr-1 h-4 w-4" />
            Download
          </Button>
        )}
      </div>
      
      <div className="bg-muted/30 p-4 rounded-md border overflow-auto max-h-[60vh]">
        <pre className="text-sm whitespace-pre-wrap font-sans">
          {contract.content}
        </pre>
      </div>
      
      <div className="text-sm text-muted-foreground">
        <p>Last updated: {new Date(contract.updatedAt || contract.createdAt).toLocaleDateString()}</p>
      </div>
    </div>
  );
}
