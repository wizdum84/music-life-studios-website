import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, PlusCircle, Download, Eye, Trash2, Upload } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import FileUploader from "./FileUploader";

// Define contract types
interface Contract {
  id: number;
  title: string;
  description: string;
  fileUrl: string;
  fileType: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export default function ContractManager() {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    fileUrl: "",
    fileType: "pdf",
    category: "licensing"
  });
  
  // Sample contracts (in a real app, we'd fetch these from an API)
  const contracts = [
    {
      id: 1,
      title: "Basic License Agreement",
      description: "Standard licensing agreement for basic beat licenses",
      fileUrl: "https://storage.musiclifestudios.com/contracts/basic-license.pdf",
      fileType: "pdf",
      category: "licensing",
      createdAt: "2023-10-15",
      updatedAt: "2023-10-15"
    },
    {
      id: 2,
      title: "Premium License Agreement",
      description: "Expanded rights for premium licensees",
      fileUrl: "https://storage.musiclifestudios.com/contracts/premium-license.pdf",
      fileType: "pdf",
      category: "licensing",
      createdAt: "2023-10-15",
      updatedAt: "2023-10-15"
    },
    {
      id: 3,
      title: "Exclusive License Agreement",
      description: "Full ownership rights transfer agreement",
      fileUrl: "https://storage.musiclifestudios.com/contracts/exclusive-license.pdf",
      fileType: "pdf",
      category: "licensing",
      createdAt: "2023-10-15",
      updatedAt: "2023-10-15"
    },
    {
      id: 4,
      title: "Studio Service Agreement",
      description: "Terms and conditions for studio sessions",
      fileUrl: "https://storage.musiclifestudios.com/contracts/studio-service.pdf",
      fileType: "pdf",
      category: "services",
      createdAt: "2023-11-02",
      updatedAt: "2023-11-02"
    },
    {
      id: 5,
      title: "Mixing Service Agreement",
      description: "Terms for mixing and mastering services",
      fileUrl: "https://storage.musiclifestudios.com/contracts/mixing-service.pdf",
      fileType: "pdf",
      category: "services",
      createdAt: "2023-11-02",
      updatedAt: "2023-11-02"
    }
  ];
  
  // Filter contracts by category
  const licensingContracts = contracts.filter(c => c.category === "licensing");
  const serviceContracts = contracts.filter(c => c.category === "services");
  const otherContracts = contracts.filter(c => !["licensing", "services"].includes(c.category));
  
  // Simulate file upload
  const simulateFileUpload = (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    // Simulate progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 5;
      });
    }, 200);
    
    // Simulate completion after 3 seconds
    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(100);
      setIsUploading(false);
      
      // Create a fake URL for demo purposes
      const fakeUrl = `https://storage.musiclifestudios.com/contracts/${Date.now()}-${file.name.replace(/\s+/g, '-').toLowerCase()}`;
      
      // Update form data with the URL
      setFormData(prev => ({
        ...prev,
        fileUrl: fakeUrl,
        fileType: file.name.split('.').pop()?.toLowerCase() || 'pdf'
      }));
      
      // Generate a preview URL
      if (file.type === "application/pdf") {
        setPreviewUrl(`https://docs.google.com/viewer?url=${encodeURIComponent(fakeUrl)}&embedded=true`);
      } else {
        setPreviewUrl(null);
      }
      
      toast({
        title: "File uploaded successfully",
        description: `${file.name} has been uploaded`,
      });
    }, 3000);
  };
  
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      fileUrl: "",
      fileType: "pdf",
      category: "licensing"
    });
    setPreviewUrl(null);
  };
  
  const handleAddContract = () => {
    // Basic validation
    if (!formData.title || !formData.description || !formData.fileUrl) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    // Add contract logic would go here
    toast({
      title: "Contract added successfully",
    });
    setShowAddDialog(false);
    resetForm();
  };
  
  const openPreview = (url: string) => {
    window.open(url, '_blank');
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Contract Manager</CardTitle>
          <CardDescription>Upload and manage legal agreements and contracts</CardDescription>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Contract
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Contract</DialogTitle>
              <DialogDescription>
                Upload a contract or legal document for your clients.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Contract Title</Label>
                <Input 
                  id="title" 
                  placeholder="e.g., Basic License Agreement" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input 
                  id="description" 
                  placeholder="Brief description of this contract" 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <select 
                  id="category"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option value="licensing">Beat Licensing</option>
                  <option value="services">Studio Services</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <FileUploader
                label="Contract File"
                description="Upload contract (PDF, DOC, DOCX)"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                maxSize={10}
                onFileSelected={simulateFileUpload}
                uploading={isUploading}
                uploadProgress={uploadProgress}
                uploadSuccess={formData.fileUrl !== ""}
              />
              
              {previewUrl && (
                <div className="mt-2">
                  <Label className="block mb-2">Preview</Label>
                  <iframe 
                    src={previewUrl} 
                    className="w-full h-64 border rounded"
                    title="Document Preview"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
              </DialogClose>
              <Button onClick={handleAddContract}>
                Add Contract
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="licensing" className="space-y-4">
          <TabsList>
            <TabsTrigger value="licensing">Beat Licensing</TabsTrigger>
            <TabsTrigger value="services">Studio Services</TabsTrigger>
            <TabsTrigger value="other">Other Documents</TabsTrigger>
          </TabsList>
          
          <TabsContent value="licensing" className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licensingContracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                      No licensing contracts uploaded yet
                    </TableCell>
                  </TableRow>
                ) : (
                  licensingContracts.map(contract => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {contract.title}
                        </div>
                      </TableCell>
                      <TableCell>{contract.description}</TableCell>
                      <TableCell>{new Date(contract.updatedAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openPreview(contract.fileUrl)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => window.open(contract.fileUrl, '_blank')}>
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>
          
          <TabsContent value="services" className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceContracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                      No service contracts uploaded yet
                    </TableCell>
                  </TableRow>
                ) : (
                  serviceContracts.map(contract => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {contract.title}
                        </div>
                      </TableCell>
                      <TableCell>{contract.description}</TableCell>
                      <TableCell>{new Date(contract.updatedAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openPreview(contract.fileUrl)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => window.open(contract.fileUrl, '_blank')}>
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>
          
          <TabsContent value="other" className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {otherContracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                      No other documents uploaded yet
                    </TableCell>
                  </TableRow>
                ) : (
                  otherContracts.map(contract => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {contract.title}
                        </div>
                      </TableCell>
                      <TableCell>{contract.description}</TableCell>
                      <TableCell>{new Date(contract.updatedAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openPreview(contract.fileUrl)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => window.open(contract.fileUrl, '_blank')}>
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}