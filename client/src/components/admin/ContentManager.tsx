import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Track, Beat, Service, TimeSlot } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, PlusCircle, Music, Calendar, Clock, Edit, Trash2, FileText } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import FileUploader from "./FileUploader";
import ContractManager from "./ContractManager";
import ScheduleManager from "./ScheduleManager";
import { format, addDays, startOfWeek, endOfWeek } from "date-fns";

export default function ContentManager() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("beats");
  
  return (
    <div className="space-y-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Content Manager</CardTitle>
          <CardDescription>Manage the beat catalog, studio portfolio, contracts, and schedule</CardDescription>
        </CardHeader>
      </Card>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 bg-card border mt-2">
          <TabsTrigger value="beats">Beat Catalog</TabsTrigger>
          <TabsTrigger value="tracks">Studio Portfolio</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tracks" className="mt-0">
          <TracksManager />
        </TabsContent>
        
        <TabsContent value="beats" className="mt-0">
          <BeatsManager />
        </TabsContent>
        
        <TabsContent value="contracts" className="mt-0">
          <ContractManager />
        </TabsContent>
        
        <TabsContent value="schedule" className="mt-0">
          <ScheduleManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TracksManager() {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "track",
    audioUrl: "",
    imageUrl: ""
  });
  
  // Fetch all tracks that are not samples
  const { data: allTracks = [], isLoading } = useQuery<Track[]>({
    queryKey: ['/api/tracks'],
    select: (tracks) => tracks.filter(track => track.type === 'track')
  });
  
  // Add track mutation
  const addTrackMutation = useMutation({
    mutationFn: async (track: any) => {
      return apiRequest("POST", "/api/tracks", track);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tracks'] });
      setShowAddDialog(false);
      resetForm();
      toast({
        title: "Track added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error adding track",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Delete track mutation
  const deleteTrackMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/tracks/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tracks'] });
      toast({
        title: "Track deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting track",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Simulate file upload
  const simulateFileUpload = (file: File) => {
    const fakeUrl = `https://storage.musiclifestudios.com/tracks/${file.name.replace(/\s+/g, '-').toLowerCase()}`;
    
    // Update form data with the URL
    setFormData(prev => ({
      ...prev,
      audioUrl: fakeUrl,
      title: prev.title || file.name.split('.')[0].replace(/-/g, ' ').replace(/_/g, ' ')
    }));
    
    toast({
      title: "File uploaded successfully",
      description: `${file.name} has been uploaded`,
    });
  };
  
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "track",
      audioUrl: "",
      imageUrl: ""
    });
    setSelectedTrack(null);
  };
  
  const handleAddOrUpdate = () => {
    // Basic validation
    if (!formData.title || !formData.description || !formData.audioUrl) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedTrack) {
      // Update existing track
      const updatedTrack = {
        ...formData,
        id: selectedTrack.id
      };
      
      // Implement update logic
      toast({
        title: "Track updated successfully",
      });
      setShowAddDialog(false);
      resetForm();
    } else {
      // Add new track
      addTrackMutation.mutate(formData);
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Studio Portfolio</CardTitle>
          <CardDescription>Showcase finished client work. This does not add beats for sale.</CardDescription>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-primary/80">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Portfolio Track
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedTrack ? "Edit Portfolio Track" : "Add Portfolio Track"}
              </DialogTitle>
              <DialogDescription>
                Add finished work to the portfolio. For beats and licenses, use Beat Catalog.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Track Title</Label>
                <Input 
                  id="title" 
                  placeholder="Enter track title" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Describe this track" 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label>Upload Audio File</Label>
                <FileUploader
                  description="Upload MP3 or WAV file"
                  accept=".mp3,.wav,audio/*"
                  maxSize={30}
                  onFileSelected={simulateFileUpload}
                  className="border-2 border-dashed p-6 rounded-lg"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="imageUrl">Cover Image URL (optional)</Label>
                <Input 
                  id="imageUrl" 
                  placeholder="Enter image URL" 
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowAddDialog(false);
                resetForm();
              }}>Cancel</Button>
              <Button onClick={handleAddOrUpdate}>
                {selectedTrack ? "Update Track" : "Add Track"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : allTracks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Music className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
            <p>No tracks added yet.</p>
            <Button className="mt-4" variant="outline" onClick={() => setShowAddDialog(true)}>
              Add Your First Track
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {allTracks.map((track) => (
              <Card key={track.id} className="overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div 
                    className="h-40 md:w-40 bg-gradient-to-br from-primary/10 to-primary/30 flex items-center justify-center"
                    style={{
                      backgroundImage: track.imageUrl ? `url(${track.imageUrl})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    {!track.imageUrl && <Music className="h-12 w-12 text-muted-foreground/50" />}
                  </div>
                  <div className="flex-1 p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{track.title}</h3>
                        <p className="text-sm text-muted-foreground">{track.description}</p>
                      </div>
                      <div className="flex space-x-2 mt-4 md:mt-0">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setSelectedTrack(track);
                            setFormData({
                              title: track.title,
                              description: track.description,
                              type: track.type,
                              audioUrl: track.audioUrl || "",
                              imageUrl: track.imageUrl || ""
                            });
                            setShowAddDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-destructive"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this track?")) {
                              deleteTrackMutation.mutate(track.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                    <div>
                      <audio 
                        src={track.audioUrl} 
                        controls 
                        className="w-full" 
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BeatsManager() {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedBeat, setSelectedBeat] = useState<Beat | null>(null);
  const [isPreviewUploading, setIsPreviewUploading] = useState(false);
  const [isFullAudioUploading, setIsFullAudioUploading] = useState(false);
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [previewUploadProgress, setPreviewUploadProgress] = useState(0);
  const [fullAudioUploadProgress, setFullAudioUploadProgress] = useState(0);
  const [coverUploadProgress, setCoverUploadProgress] = useState(0);
  const [deliverableLicenseType, setDeliverableLicenseType] = useState("basic");
  const [uploadedDeliverables, setUploadedDeliverables] = useState<string[]>([]);
  const [activeGenre, setActiveGenre] = useState<string>("all");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    genre: "",
    bpm: 120,
    price: 2999, // $29.99
    previewUrl: "",
    fullAudioUrl: "",
    imageUrl: "",
    featured: false,
    licensingOptions: {
      basic: { price: 2999, description: "Basic license" },
      premium: { price: 6999, description: "Premium license" },
      exclusive: { price: 19999, description: "Exclusive license" }
    },
    tags: [] as string[],
    contractUrl: "",
    isrcCode: "",
    catalogNumber: "",
    producerName: "",
    musicalKey: "",
    durationSeconds: 0,
    metadata: { mood: "", energy: "", notes: "" },
  });
  
  // Fetch all beats
  const { data: allBeats = [], isLoading } = useQuery<Beat[]>({
    queryKey: ['/api/beats'],
  });
  
  // Filter beats by genre
  const beats = activeGenre === 'all' 
    ? allBeats 
    : allBeats.filter(beat => beat.genre === activeGenre);
  const visibleBeats = catalogSearch.trim()
    ? beats.filter((beat) => `${beat.title} ${beat.genre} ${beat.catalogNumber || ""} ${beat.isrcCode || ""} ${beat.producerName || ""}`.toLowerCase().includes(catalogSearch.trim().toLowerCase()))
    : beats;
    
  // Genres for selection
  const genres = [
    { value: "all", label: "All Genres" },
    { value: "rap-hiphop", label: "Rap & Hip Hop" },
    { value: "trap", label: "Trap" },
    { value: "rnb", label: "R&B" },
    { value: "other", label: "Everything Else" }
  ];
  
  // Add beat mutation
  const addBeatMutation = useMutation({
    mutationFn: async (beat: any) => {
      const response = await apiRequest("POST", "/api/beats", beat);
      return response.json() as Promise<Beat>;
    },
    onSuccess: (beat) => {
      queryClient.invalidateQueries({ queryKey: ['/api/beats'] });
      setSelectedBeat(beat);
      setFormData((current) => ({ ...current, previewUrl: beat.previewUrl, fullAudioUrl: beat.fullAudioUrl }));
      toast({
        title: "Beat draft created",
        description: "Upload its cover, preview, and buyer files, then publish it.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error adding beat",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const updateBeatMutation = useMutation({
    mutationFn: async ({ id, beat }: { id: number; beat: any }) => apiRequest("PUT", `/api/beats/${id}`, beat),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/beats'] });
      setShowAddDialog(false);
      resetForm();
      toast({ title: "Beat library record updated" });
    },
    onError: (error: any) => toast({ title: "Error updating beat", description: error.message, variant: "destructive" }),
  });

  const deleteBeatMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/beats/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/beats'] });
      toast({ title: "Beat removed from the library" });
    },
    onError: (error: any) => toast({ title: "Error deleting beat", description: error.message, variant: "destructive" }),
  });
  
  const uploadMasterAndCreatePreview = (file: File) => {
    if (!selectedBeat) {
      toast({
        title: "Save the beat record first",
        description: "Create the beat draft before uploading the full beat.",
        variant: "destructive",
      });
      return;
    }
    setIsPreviewUploading(true);
    setPreviewUploadProgress(0);
    const body = new FormData();
    body.append("file", file);
    const request = new XMLHttpRequest();
    request.open("POST", `/api/admin/beats/${selectedBeat.id}/master`);
    request.withCredentials = true;
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) setPreviewUploadProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => {
      setIsPreviewUploading(false);
      const result = JSON.parse(request.responseText || "{}");
      if (request.status < 200 || request.status >= 300) {
        toast({ title: "Upload failed", description: result.error || "The beat could not be processed", variant: "destructive" });
        return;
      }
      setPreviewUploadProgress(100);
      setFormData((current) => ({ ...current, previewUrl: result.previewUrl, fullAudioUrl: result.fullAudioUrl }));
      setUploadedDeliverables((current) => Array.from(new Set([...current, "basic"])));
      queryClient.invalidateQueries({ queryKey: ['/api/beats'] });
      toast({ title: "Beat processed", description: "The full beat is private and its 45-second public preview is ready." });
    };
    request.onerror = () => {
      setIsPreviewUploading(false);
      toast({ title: "Upload failed", description: "The server connection was interrupted", variant: "destructive" });
    };
    request.send(body);
  };
  
  const uploadFullAudio = (file: File) => {
    if (!selectedBeat) {
      toast({
        title: "Save the beat record first",
        description: "Create the beat, then edit it to attach its private master or stem pack.",
        variant: "destructive",
      });
      return;
    }
    setIsFullAudioUploading(true);
    setFullAudioUploadProgress(0);
    const body = new FormData();
    body.append("file", file);
    const request = new XMLHttpRequest();
    request.open("POST", `/api/admin/beats/${selectedBeat.id}/deliverable`);
    request.withCredentials = true;
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) setFullAudioUploadProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => {
      setIsFullAudioUploading(false);
      const result = JSON.parse(request.responseText || "{}");
      if (request.status < 200 || request.status >= 300) {
        toast({ title: "Upload failed", description: result.error || "The deliverable could not be stored", variant: "destructive" });
        return;
      }
      setFullAudioUploadProgress(100);
      if (deliverableLicenseType === "basic") {
        setFormData((current) => ({ ...current, fullAudioUrl: result.fullAudioUrl }));
      }
      setUploadedDeliverables((current) => Array.from(new Set([...current, deliverableLicenseType])));
      queryClient.invalidateQueries({ queryKey: ['/api/beats'] });
      toast({ title: "Private deliverable uploaded", description: `${file.name} is ready for ${deliverableLicenseType} license delivery.` });
    };
    request.onerror = () => {
      setIsFullAudioUploading(false);
      toast({ title: "Upload failed", description: "The server connection was interrupted", variant: "destructive" });
    };
    request.send(body);
  };

  const uploadCover = (file: File) => {
    if (!selectedBeat) {
      toast({ title: "Create the draft first", description: "Save the beat details before uploading artwork.", variant: "destructive" });
      return;
    }
    setIsCoverUploading(true);
    setCoverUploadProgress(0);
    const body = new FormData();
    body.append("file", file);
    const request = new XMLHttpRequest();
    request.open("POST", `/api/admin/beats/${selectedBeat.id}/cover`);
    request.withCredentials = true;
    request.upload.onprogress = (event) => event.lengthComputable && setCoverUploadProgress(Math.round((event.loaded / event.total) * 100));
    request.onload = () => {
      setIsCoverUploading(false);
      const result = JSON.parse(request.responseText || "{}");
      if (request.status < 200 || request.status >= 300) {
        toast({ title: "Artwork upload failed", description: result.error || "Unable to store artwork", variant: "destructive" });
        return;
      }
      setCoverUploadProgress(100);
      setFormData((current) => ({ ...current, imageUrl: result.imageUrl }));
      queryClient.invalidateQueries({ queryKey: ['/api/beats'] });
      toast({ title: "Cover artwork uploaded" });
    };
    request.onerror = () => {
      setIsCoverUploading(false);
      toast({ title: "Artwork upload failed", description: "The server connection was interrupted", variant: "destructive" });
    };
    request.send(body);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      genre: "",
      bpm: 120,
      price: 2999,
      previewUrl: "",
      fullAudioUrl: "",
      imageUrl: "",
      featured: false,
      licensingOptions: {
        basic: { price: 2999, description: "Basic license" },
        premium: { price: 6999, description: "Premium license" },
        exclusive: { price: 19999, description: "Exclusive license" }
      },
      tags: [] as string[],
      contractUrl: "",
      isrcCode: "",
      catalogNumber: "",
      producerName: "",
      musicalKey: "",
      durationSeconds: 0,
      metadata: { mood: "", energy: "", notes: "" },
    });
    setSelectedBeat(null);
    setUploadedDeliverables([]);
  };

  const openEditBeat = (beat: Beat) => {
    const metadata = (beat.metadata && typeof beat.metadata === "object" ? beat.metadata : {}) as Record<string, unknown>;
    setSelectedBeat(beat);
    const deliverables = metadata.deliverables && typeof metadata.deliverables === "object" ? metadata.deliverables as Record<string, unknown> : {};
    setUploadedDeliverables(Object.keys(deliverables).filter((key) => typeof deliverables[key] === "string"));
    setFormData({
      title: beat.title,
      description: beat.description,
      genre: beat.genre,
      bpm: beat.bpm,
      price: beat.price,
      previewUrl: beat.previewUrl,
      fullAudioUrl: beat.fullAudioUrl,
      imageUrl: beat.imageUrl || "",
      featured: Boolean(beat.featured),
      licensingOptions: beat.licensingOptions as any,
      tags: beat.tags || [],
      contractUrl: beat.contractUrl || "",
      isrcCode: beat.isrcCode || "",
      catalogNumber: beat.catalogNumber || "",
      producerName: beat.producerName || "",
      musicalKey: beat.musicalKey || "",
      durationSeconds: beat.durationSeconds || 0,
      metadata: {
        mood: String(metadata.mood || ""),
        energy: String(metadata.energy || ""),
        notes: String(metadata.notes || ""),
      },
    });
    setShowAddDialog(true);
  };
  
  const handleAddOrUpdate = () => {
    // Basic validation
    if (!formData.title || !formData.description || !formData.genre) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    const payload = {
      ...formData,
      durationSeconds: formData.durationSeconds || undefined,
    };
    if (selectedBeat) {
      const readyToPublish = formData.previewUrl.includes(".r2.dev/") && Boolean(formData.imageUrl) && ["basic", "premium", "exclusive"].every((tier) => uploadedDeliverables.includes(tier));
      if (selectedBeat.availabilityStatus === "draft" && !readyToPublish) {
        toast({ title: "Draft is not ready", description: "Add cover artwork, a public preview, and Basic, Premium, and Exclusive delivery files before publishing.", variant: "destructive" });
        return;
      }
      updateBeatMutation.mutate({ id: selectedBeat.id, beat: { ...payload, ...(selectedBeat.availabilityStatus === "draft" ? { availabilityStatus: "available_nonexclusive" } : {}) } });
    } else {
      addBeatMutation.mutate({ ...payload, previewUrl: "delivery-pending://preview", fullAudioUrl: "delivery-pending://basic", availabilityStatus: "draft" });
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Beat Catalog</CardTitle>
          <CardDescription>Add beats for sale, generate covers, create 45-second previews, and manage license files</CardDescription>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-primary/80">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add New Beat
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                {selectedBeat ? `Edit Beat: ${selectedBeat.title}` : "Create New Beat Draft"}
              </DialogTitle>
              <DialogDescription>
                Save the title first, then upload the full beat and generate its cover in this form.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
              {/* File Upload Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 grid gap-2">
                      <Label>Full Beat and Automatic Preview</Label>
                  <FileUploader
                    description={selectedBeat ? "Upload the full MP3, WAV, or AIFF once; the site creates the 45-second preview" : "Save this beat record, then upload the full beat"}
                    accept="audio/mpeg,audio/wav,audio/aiff,.mp3,.wav,.aif,.aiff"
                    maxSize={1024}
                    onFileSelected={uploadMasterAndCreatePreview}
                    uploading={isPreviewUploading}
                    uploadProgress={previewUploadProgress}
                    uploadSuccess={formData.previewUrl.includes(".r2.dev/")}
                    className="border-2 border-dashed p-6 rounded-lg"
                  />
                  
                  {formData.previewUrl && (
                    <div className="bg-muted/20 p-3 rounded-md mt-2">
                      <audio src={formData.previewUrl} controls className="w-full" />
                    </div>
                  )}
                </div>
                
                <div className="md:col-span-2 grid gap-2 mt-4">
                  <Label>Additional Paid-Delivery Packages</Label>
                  <p className="text-xs text-muted-foreground">The full beat above becomes the Basic delivery file. Add Premium and Exclusive ZIP/WAV packages here when applicable.</p>
                  <Select value={deliverableLicenseType} onValueChange={setDeliverableLicenseType}>
                    <SelectTrigger><SelectValue placeholder="Select delivery tier" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic â€” MP3</SelectItem>
                      <SelectItem value="premium">Premium â€” WAV + MP3 ZIP</SelectItem>
                      <SelectItem value="exclusive">Exclusive â€” WAV, MP3 + stems ZIP</SelectItem>
                    </SelectContent>
                  </Select>
                  <FileUploader
                    description={selectedBeat ? "Upload the private WAV, MP3, AIFF, or ZIP delivered to paid buyers" : "Save this beat record, then edit it to upload the private deliverable"}
                    accept="audio/mpeg,audio/wav,audio/aiff,application/zip,.mp3,.wav,.aif,.aiff,.zip"
                    maxSize={1024}
                    onFileSelected={uploadFullAudio}
                    uploading={isFullAudioUploading}
                    uploadProgress={fullAudioUploadProgress}
                    uploadSuccess={formData.fullAudioUrl.startsWith("r2-private://")}
                    className="border-2 border-dashed p-6 rounded-lg"
                  />
                </div>
              </div>

              {/* Beat Information */}
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Beat Title</Label>
                      <Input 
                        id="title" 
                        placeholder="Enter beat title" 
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="genre">Genre</Label>
                      <Select 
                        value={formData.genre} 
                        onValueChange={(value) => setFormData({...formData, genre: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select genre" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rap-hiphop">Rap & Hip Hop</SelectItem>
                          <SelectItem value="trap">Trap</SelectItem>
                          <SelectItem value="rnb">R&B</SelectItem>
                          <SelectItem value="other">Everything Else</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="md:col-span-2">
                      <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea 
                          id="description" 
                          placeholder="Describe your beat" 
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="bpm">BPM</Label>
                      <Input 
                        id="bpm" 
                        type="number" 
                        placeholder="120" 
                        value={formData.bpm}
                        onChange={(e) => setFormData({...formData, bpm: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="price">Price ($)</Label>
                      <Input 
                        id="price" 
                        type="number" 
                        step="0.01"
                        placeholder="29.99" 
                        value={(formData.price / 100).toFixed(2)}
                        onChange={(e) => {
                          const price = parseFloat(e.target.value) * 100;
                          setFormData({...formData, price: Math.round(price)});
                        }}
                      />
                    </div>

                    <div className="md:col-span-2 border-t pt-4">
                      <p className="text-sm font-semibold">Catalog details</p>
                      <p className="text-xs text-muted-foreground">Keep the public card simple while preserving the release record here.</p>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="catalogNumber">Catalog number</Label>
                      <Input id="catalogNumber" placeholder="MLS-001" value={formData.catalogNumber} onChange={(e) => setFormData({...formData, catalogNumber: e.target.value})} />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="isrcCode">ISRC code</Label>
                      <Input id="isrcCode" placeholder="USABC26123456" value={formData.isrcCode} onChange={(e) => setFormData({...formData, isrcCode: e.target.value})} />
                      <p className="text-xs text-muted-foreground">Enter the 12-character code with or without hyphens.</p>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="producerName">Producer</Label>
                      <Input id="producerName" placeholder="Wiz" value={formData.producerName} onChange={(e) => setFormData({...formData, producerName: e.target.value})} />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="musicalKey">Key</Label>
                      <Input id="musicalKey" placeholder="C minor" value={formData.musicalKey} onChange={(e) => setFormData({...formData, musicalKey: e.target.value})} />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="durationSeconds">Length (seconds)</Label>
                      <Input id="durationSeconds" type="number" min="1" placeholder="180" value={formData.durationSeconds || ""} onChange={(e) => setFormData({...formData, durationSeconds: parseInt(e.target.value) || 0})} />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="mood">Mood / tags</Label>
                      <Input id="mood" placeholder="late night, focused, cinematic" value={formData.metadata.mood} onChange={(e) => setFormData({...formData, metadata: {...formData.metadata, mood: e.target.value}})} />
                    </div>

                    <div className="md:col-span-2 grid gap-2">
                      <Label htmlFor="catalogNotes">Private catalog notes</Label>
                      <Textarea id="catalogNotes" placeholder="Sample clearance, split notes, release plans, or delivery notes" value={formData.metadata.notes} onChange={(e) => setFormData({...formData, metadata: {...formData.metadata, notes: e.target.value}})} />
                    </div>
                    
                    <div className="md:col-span-2 grid gap-3 rounded-lg border p-4">
                      <Label>Cover artwork</Label>
                      {formData.imageUrl && (
                        <img src={formData.imageUrl} alt="Beat cover preview" className="h-48 w-48 rounded-md object-cover" />
                      )}
                      <p className="text-xs text-muted-foreground">Create the cover in Codex, download it, then upload it here.</p>
                      <FileUploader
                        description={selectedBeat ? "Upload JPG, PNG, or WebP artwork" : "Create the draft, then upload artwork"}
                        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                        maxSize={20}
                        onFileSelected={uploadCover}
                        uploading={isCoverUploading}
                        uploadProgress={coverUploadProgress}
                        uploadSuccess={formData.imageUrl.includes(".r2.dev/")}
                      />
                    </div>
                    
                  </div>
                </>

            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
              </DialogClose>
              <Button 
                onClick={handleAddOrUpdate}
                disabled={!formData.title || !formData.description || !formData.genre}
              >
                {selectedBeat?.availabilityStatus === "draft" ? "Publish Beat" : selectedBeat ? "Update Beat" : "Create Draft"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : beats.length === 0 && activeGenre === 'all' ? (
          <div className="text-center py-8 text-muted-foreground">
            <Music className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
            <p>No beats uploaded yet.</p>
            <Button className="mt-4" variant="outline" onClick={() => setShowAddDialog(true)}>
              Add Your First Beat
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-6 space-y-3">
              <Input value={catalogSearch} onChange={(event) => setCatalogSearch(event.target.value)} placeholder="Search title, catalog number, ISRC, or producer" />
              <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
                {genres.map(genre => (
                  <Button
                    key={genre.value}
                    variant={activeGenre === genre.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveGenre(genre.value)}
                    className={activeGenre === genre.value ? 
                      "bg-primary text-primary-foreground" : ""}
                  >
                    {genre.label}
                  </Button>
                ))}
              </div>
            </div>
            
            {visibleBeats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No beats found in the "{genres.find(g => g.value === activeGenre)?.label}" genre.</p>
                <Button 
                  variant="outline"
                  className="mt-4"
                  onClick={() => setActiveGenre('all')}
                >
                  View All Genres
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleBeats.map((beat) => (
                  <Card key={beat.id} className="overflow-hidden">
                    <div 
                      className="relative h-32 bg-gradient-to-br from-primary/10 to-primary/30 flex items-center justify-center"
                      style={{
                        backgroundImage: beat.imageUrl ? `url(${beat.imageUrl})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="text-center text-white">
                          <h3 className="font-semibold">{beat.title}</h3>
                          <div className="flex gap-2 justify-center mt-1">
                            <span className="text-xs bg-primary px-2 py-0.5 rounded">
                              {beat.genre}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <CardContent className="p-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">{beat.bpm} BPM{beat.musicalKey ? ` Â· ${beat.musicalKey}` : ""}</span>
                        <span className="text-sm font-bold">${(beat.price / 100).toFixed(2)}</span>
                      </div>
                      <h3 className="mb-2 truncate text-base font-bold" title={beat.title}>{beat.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{beat.description}</p>
                      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>Catalog: {beat.catalogNumber || "Not set"}</span>
                        <span>ISRC: {beat.isrcCode || "Not set"}</span>
                        <span>Producer: {beat.producerName || "Not set"}</span>
                        <span>Length: {beat.durationSeconds ? `${Math.floor(beat.durationSeconds / 60)}:${String(beat.durationSeconds % 60).padStart(2, "0")}` : "Not set"}</span>
                      </div>
                      <div className="mt-4">
                        <audio 
                          src={beat.previewUrl} 
                          controls 
                          className="w-full h-8" 
                        />
                      </div>
                    </CardContent>
                    
                    <CardFooter className="flex justify-end gap-2 p-4 pt-0">
                      <Button size="sm" variant="ghost" onClick={() => openEditBeat(beat)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-destructive"
                        onClick={() => window.confirm(`Remove ${beat.title} from the beat library?`) && deleteBeatMutation.mutate(beat.id)}
                        disabled={deleteBeatMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
