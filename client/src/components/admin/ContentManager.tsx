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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
  const [activeTab, setActiveTab] = useState("tracks");
  
  return (
    <div className="space-y-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Content Manager</CardTitle>
          <CardDescription>Manage your portfolio tracks, samples, beats, and contracts</CardDescription>
        </CardHeader>
      </Card>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="border-b">
          <div className="overflow-x-auto custom-scrollbar pb-2">
            <TabsList className="w-full md:w-auto inline-flex p-1 bg-muted/20 mb-4">
              <TabsTrigger 
                value="tracks" 
                className="px-4 py-2.5 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Music className="h-4 w-4 mr-2" />
                Music Portfolio
              </TabsTrigger>
              
              <TabsTrigger 
                value="samples" 
                className="px-4 py-2.5 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <span className="flex items-center">
                  <Music className="h-4 w-4 mr-2" />
                  Samples
                </span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="beats" 
                className="px-4 py-2.5 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <span className="flex items-center">
                  <Music className="h-4 w-4 mr-2" />
                  Beat Marketplace
                </span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="services" 
                className="px-4 py-2.5 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Services
                </span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="contracts" 
                className="px-4 py-2.5 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <span className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Contracts
                </span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>
        
        <TabsContent value="tracks">
          <TracksManager />
        </TabsContent>
        
        <TabsContent value="samples">
          <SamplesManager />
        </TabsContent>
        
        <TabsContent value="beats">
          <BeatsManager />
        </TabsContent>
        
        {/* Moved beats by genre into main beats manager */}
        
        <TabsContent value="services">
          <ServicesManager />
        </TabsContent>
        
        <TabsContent value="contracts">
          <ContractManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TracksManager() {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
    audioUrl: "",
    imageUrl: ""
  });
  
  // Fetch all tracks
  const { data: tracks = [], isLoading } = useQuery<Track[]>({
    queryKey: ['/api/tracks'],
  });
  
  // Add track mutation
  const addTrackMutation = useMutation({
    mutationFn: async (track: any) => {
      return apiRequest("POST", "/api/tracks", track);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tracks'] });
      setShowAddDialog(false);
      setFormData({
        title: "",
        description: "",
        type: "",
        audioUrl: "",
        imageUrl: ""
      });
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
  
  // Simulate audio file upload
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
      const fakeUrl = `https://storage.musiclifestudios.com/${Date.now()}-${file.name.replace(/\s+/g, '-').toLowerCase()}`;
      
      // Update form data with the URL
      setFormData(prev => ({
        ...prev,
        audioUrl: fakeUrl
      }));
      
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
      type: "",
      audioUrl: "",
      imageUrl: ""
    });
    setSelectedTrack(null);
  };
  
  const handleAddOrUpdate = () => {
    // Basic validation
    if (!formData.title || !formData.description || !formData.type || !formData.audioUrl) {
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
      
      // Replace with actual update logic
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
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Music Portfolio</CardTitle>
          <CardDescription>Manage your portfolio of work samples</CardDescription>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Sample
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {selectedTrack ? "Edit Sample" : "Add New Sample"}
              </DialogTitle>
              <DialogDescription>
                Upload a music sample to showcase your work in your portfolio.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
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
                  placeholder="Describe your work" 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => setFormData({...formData, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recording">Recording</SelectItem>
                    <SelectItem value="mixing">Mixing</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="mastering">Mastering</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <FileUploader
                label="Audio File"
                description="Upload the audio sample (MP3, WAV)"
                accept="audio/*"
                maxSize={100}
                onFileSelected={simulateFileUpload}
                uploading={isUploading}
                uploadProgress={uploadProgress}
                uploadSuccess={formData.audioUrl !== ""}
              />
              
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
              <DialogClose asChild>
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
              </DialogClose>
              <Button onClick={handleAddOrUpdate}>
                {selectedTrack ? "Update Sample" : "Add Sample"}
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
        ) : tracks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Music className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
            <p>No music samples uploaded yet.</p>
            <Button className="mt-4" variant="outline" onClick={() => setShowAddDialog(true)}>
              Add Your First Sample
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tracks.map((track) => (
              <Card key={track.id} className="overflow-hidden">
                <div 
                  className="h-32 bg-gradient-to-br from-primary/10 to-primary/30 flex items-center justify-center"
                  style={{
                    backgroundImage: track.imageUrl ? `url(${track.imageUrl})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="text-center text-white">
                      <h3 className="font-semibold">{track.title}</h3>
                      <span className="text-xs bg-primary px-2 py-0.5 rounded">
                        {track.type.charAt(0).toUpperCase() + track.type.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">{track.description}</p>
                  <div className="mt-4 flex justify-between items-center">
                    <audio 
                      src={track.audioUrl} 
                      controls 
                      className="w-full h-8" 
                    />
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-end gap-2 p-4 pt-0">
                  <Button size="sm" variant="ghost">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-destructive"
                    onClick={() => deleteTrackMutation.mutate(track.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </CardFooter>
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
  const [previewUploadProgress, setPreviewUploadProgress] = useState(0);
  const [fullAudioUploadProgress, setFullAudioUploadProgress] = useState(0);
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
    tags: [],
    contractUrl: ""
  });
  
  // Fetch all beats
  const { data: beats = [], isLoading } = useQuery<Beat[]>({
    queryKey: ['/api/beats'],
  });
  
  // Add beat mutation
  const addBeatMutation = useMutation({
    mutationFn: async (beat: any) => {
      return apiRequest("POST", "/api/beats", beat);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/beats'] });
      setShowAddDialog(false);
      resetForm();
      toast({
        title: "Beat added successfully",
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
  
  // Simulate preview file upload
  const simulatePreviewUpload = (file: File) => {
    setIsPreviewUploading(true);
    setPreviewUploadProgress(0);
    
    // Detect file type and suggest title if empty
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!formData.title) {
      const suggestedTitle = file.name.split('.')[0].replace(/-/g, ' ').replace(/_/g, ' ');
      setFormData(prev => ({
        ...prev,
        title: suggestedTitle
      }));
    }
    
    // Simulate progress
    const interval = setInterval(() => {
      setPreviewUploadProgress(prev => {
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
      setPreviewUploadProgress(100);
      setIsPreviewUploading(false);
      
      // Create a fake URL for demo purposes
      const fakeUrl = `https://storage.musiclifestudios.com/preview-${Date.now()}-${file.name.replace(/\s+/g, '-').toLowerCase()}`;
      
      // Update form data with the URL
      setFormData(prev => ({
        ...prev,
        previewUrl: fakeUrl
      }));
      
      toast({
        title: "Preview uploaded successfully",
        description: `${file.name} has been uploaded`,
      });
    }, 3000);
  };
  
  // Simulate full audio file upload (handles MP3, WAV and stem packs)
  const simulateFullAudioUpload = (file: File) => {
    setIsFullAudioUploading(true);
    setFullAudioUploadProgress(0);
    
    // Check if this is a stem pack (ZIP or RAR)
    const extension = file.name.split('.').pop()?.toLowerCase();
    const isStemPack = extension === 'zip' || extension === 'rar';
    const isWav = extension === 'wav';
    
    // Display different toast message based on file type
    const fileTypeDisplay = isStemPack ? "stem pack" : 
                            isWav ? "WAV file" : "MP3 file";
    
    // Simulate progress
    const interval = setInterval(() => {
      setFullAudioUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 5;
      });
    }, 250);
    
    // Simulate completion after 4 seconds
    setTimeout(() => {
      clearInterval(interval);
      setFullAudioUploadProgress(100);
      setIsFullAudioUploading(false);
      
      // Create a fake URL for demo purposes
      const fakeUrl = `https://storage.musiclifestudios.com/full-${Date.now()}-${file.name.replace(/\s+/g, '-').toLowerCase()}`;
      
      // If this is a stem pack, we would have individual files for each stem
      if (isStemPack) {
        // Simulate stem files that would be in the ZIP/RAR
        const stemFiles = [
          { name: "vocals.wav", url: `https://storage.musiclifestudios.com/stems-${Date.now()}-vocals.wav` },
          { name: "drums.wav", url: `https://storage.musiclifestudios.com/stems-${Date.now()}-drums.wav` },
          { name: "bass.wav", url: `https://storage.musiclifestudios.com/stems-${Date.now()}-bass.wav` },
          { name: "melody.wav", url: `https://storage.musiclifestudios.com/stems-${Date.now()}-melody.wav` },
          { name: "fx.wav", url: `https://storage.musiclifestudios.com/stems-${Date.now()}-fx.wav` }
        ];
        
        toast({
          title: "Stem pack uploaded successfully",
          description: `${file.name} with ${stemFiles.length} stems extracted`,
        });
      } else {
        toast({
          title: `${fileTypeDisplay} uploaded successfully`,
          description: `${file.name} has been uploaded`,
        });
      }
      
      // Update form data with the URL
      setFormData(prev => ({
        ...prev,
        fullAudioUrl: fakeUrl
      }));
    }, 4000);
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
      tags: [],
      contractUrl: ""
    });
    setSelectedBeat(null);
  };
  
  const handleAddOrUpdate = () => {
    // Basic validation
    if (!formData.title || !formData.description || !formData.genre || !formData.previewUrl || !formData.fullAudioUrl) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedBeat) {
      // Update existing beat
      // Replace with actual update logic
      toast({
        title: "Beat updated successfully",
      });
      setShowAddDialog(false);
      resetForm();
    } else {
      // Add new beat
      addBeatMutation.mutate(formData);
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Beat Marketplace</CardTitle>
          <CardDescription>Upload MP3s, WAVs and stem packs for sale</CardDescription>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-primary/80">
              <PlusCircle className="h-4 w-4 mr-2" />
              Upload New Beat
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                {selectedBeat ? "Edit Beat" : "Upload New Beat"}
              </DialogTitle>
              <DialogDescription>
                Upload MP3, WAV or stem packs to sell in your marketplace
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
              {/* File Upload Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 grid gap-2">
                  <Label>Preview Audio (30-60 second clip)</Label>
                  <FileUploader
                    description="Upload a short MP3/WAV preview for customers to hear"
                    accept="audio/mpeg,audio/wav,.mp3,.wav"
                    maxSize={20}
                    onFileSelected={simulatePreviewUpload}
                    uploading={isPreviewUploading}
                    uploadProgress={previewUploadProgress}
                    uploadSuccess={formData.previewUrl !== ""}
                    className="border-2 border-dashed p-6 rounded-lg"
                  />
                  
                  {formData.previewUrl && (
                    <div className="bg-muted/20 p-3 rounded-md mt-2">
                      <audio src={formData.previewUrl} controls className="w-full" />
                    </div>
                  )}
                </div>
                
                <div className="md:col-span-2 grid gap-2 mt-4">
                  <Label>Full Audio File or Stem Pack</Label>
                  <FileUploader
                    description="Upload the full MP3/WAV or ZIP/RAR stem pack (delivered to buyers)"
                    accept="audio/mpeg,audio/wav,application/zip,application/x-rar-compressed,.mp3,.wav,.zip,.rar"
                    maxSize={200}
                    onFileSelected={simulateFullAudioUpload}
                    uploading={isFullAudioUploading}
                    uploadProgress={fullAudioUploadProgress}
                    uploadSuccess={formData.fullAudioUrl !== ""}
                    className="border-2 border-dashed p-6 rounded-lg"
                  />
                </div>
              </div>
              
              {/* Beat Information */}
              {(formData.previewUrl || formData.fullAudioUrl) && (
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
                          <SelectItem value="Hip Hop">Hip Hop</SelectItem>
                          <SelectItem value="R&B">R&B</SelectItem>
                          <SelectItem value="Pop">Pop</SelectItem>
                          <SelectItem value="Trap">Trap</SelectItem>
                          <SelectItem value="Drill">Drill</SelectItem>
                          <SelectItem value="EDM">EDM</SelectItem>
                          <SelectItem value="Rock">Rock</SelectItem>
                          <SelectItem value="Jazz">Jazz</SelectItem>
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
                      <Label htmlFor="price">Base Price ($)</Label>
                      <Input 
                        id="price" 
                        type="number" 
                        placeholder="29.99" 
                        value={formData.price / 100}
                        onChange={(e) => setFormData({...formData, price: Math.round(parseFloat(e.target.value) * 100) || 0})}
                      />
                      <p className="text-xs text-muted-foreground">Starting price for the basic license</p>
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
                    
                    <div className="flex items-center gap-2 mt-4">
                      <Checkbox 
                        id="featured" 
                        checked={formData.featured}
                        onCheckedChange={(checked) => 
                          setFormData({...formData, featured: checked === true})
                        }
                      />
                      <Label htmlFor="featured">Feature this beat on the homepage</Label>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowAddDialog(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddOrUpdate}
                disabled={!formData.previewUrl || !formData.fullAudioUrl || !formData.title || !formData.description || !formData.genre}
                className="bg-gradient-to-r from-primary to-primary/80 ml-2"
              >
                {selectedBeat ? "Update Beat" : "Add Beat"}
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
        ) : beats.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Music className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
            <p>No beats uploaded yet.</p>
            <Button className="mt-4" variant="outline" onClick={() => setShowAddDialog(true)}>
              Add Your First Beat
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {beats.map((beat) => (
              <Card key={beat.id} className="overflow-hidden">
                <div 
                  className="h-32 bg-gradient-to-br from-primary/10 to-primary/30 flex items-center justify-center"
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
                        {beat.featured && (
                          <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded">
                            Featured
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">{beat.bpm} BPM</span>
                    <span className="text-sm font-bold">${beat.price / 100}</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{beat.description}</p>
                  <div className="mt-4">
                    <audio 
                      src={beat.previewUrl} 
                      controls 
                      className="w-full h-8" 
                    />
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-end gap-2 p-4 pt-0">
                  <Button size="sm" variant="ghost">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SamplesManager() {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedSample, setSelectedSample] = useState<Track | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<string>("mp3");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "sample",
    audioUrl: "",
    imageUrl: "",
    category: "general",
    sampleType: "mp3" // mp3, wav, stem, or other
  });
  
  // Fetch all tracks that are samples
  const { data: samples = [], isLoading } = useQuery<Track[]>({
    queryKey: ['/api/tracks'],
    select: (tracks) => tracks.filter(track => track.type === 'sample')
  });
  
  // Add sample mutation
  const addSampleMutation = useMutation({
    mutationFn: async (sample: any) => {
      return apiRequest("POST", "/api/tracks", sample);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tracks'] });
      setShowAddDialog(false);
      resetForm();
      toast({
        title: "Sample added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error adding sample",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Delete sample mutation
  const deleteSampleMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/tracks/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tracks'] });
      toast({
        title: "Sample deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting sample",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Simulate audio file upload
  const handleFileUpload = (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError("");
    setUploadedFile(file);
    
    // Detect file type from extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension) {
      if (extension === 'wav') {
        setFileType('wav');
        setFormData(prev => ({ ...prev, sampleType: 'wav' }));
      } else if (extension === 'mp3') {
        setFileType('mp3');
        setFormData(prev => ({ ...prev, sampleType: 'mp3' }));
      } else if (extension === 'zip' || extension === 'rar') {
        setFileType('stem');
        setFormData(prev => ({ ...prev, sampleType: 'stem' }));
      } else {
        setFileType('other');
        setFormData(prev => ({ ...prev, sampleType: 'other' }));
      }
    }
    
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
      const fakeUrl = `https://storage.musiclifestudios.com/samples/${Date.now()}-${file.name.replace(/\s+/g, '-').toLowerCase()}`;
      
      // Update form data with the URL and suggest a title from filename
      setFormData(prev => ({
        ...prev,
        audioUrl: fakeUrl,
        title: prev.title || file.name.split('.')[0].replace(/-/g, ' ').replace(/_/g, ' ')
      }));
      
      toast({
        title: "Sample uploaded successfully",
        description: `${file.name} has been uploaded`,
      });
    }, 3000);
  };
  
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "sample",
      audioUrl: "",
      imageUrl: "",
      category: "general",
      sampleType: "mp3"
    });
    setSelectedSample(null);
    setUploadedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    setUploadError("");
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
    
    if (selectedSample) {
      // Update existing sample
      const updatedSample = {
        ...formData,
        id: selectedSample.id
      };
      
      // Replace with actual update logic
      toast({
        title: "Sample updated successfully",
      });
      setShowAddDialog(false);
      resetForm();
    } else {
      // Add new sample
      addSampleMutation.mutate(formData);
    }
  };
  
  const fileTypeDisplay = (type: string) => {
    switch (type) {
      case 'mp3':
        return 'MP3 Audio';
      case 'wav':
        return 'WAV Audio';
      case 'stem':
        return 'Stem Pack';
      default:
        return 'Audio File';
    }
  };
  
  // Category filter buttons
  const categories = [
    { value: "all", label: "All Samples" },
    { value: "drums", label: "Drums" },
    { value: "vocals", label: "Vocals" },
    { value: "bass", label: "Bass" },
    { value: "melody", label: "Melody" },
    { value: "effect", label: "Effects" },
    { value: "stem", label: "Stems" }
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Sample Library</CardTitle>
          <CardDescription>Manage your collection of audio samples</CardDescription>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-primary/80">
              <PlusCircle className="h-4 w-4 mr-2" />
              Upload Sample
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                {selectedSample ? "Edit Sample" : "Upload New Sample"}
              </DialogTitle>
              <DialogDescription>
                Upload MP3s, WAVs, or Stem packs to showcase your work.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <FileUploader
                    label="Upload Audio File"
                    description="MP3, WAV, Stem Packs (ZIP), or other audio files"
                    accept=".mp3,.wav,.zip,.rar,audio/*"
                    maxSize={100}
                    onFileSelected={handleFileUpload}
                    uploading={isUploading}
                    uploadProgress={uploadProgress}
                    uploadError={uploadError}
                    uploadSuccess={formData.audioUrl !== ""}
                    className="border-2 border-dashed p-6 rounded-lg"
                  />
                </div>
                
                {formData.audioUrl && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="title">Sample Title</Label>
                      <Input 
                        id="title" 
                        placeholder="Enter sample title" 
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({...formData, category: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="vocals">Vocals</SelectItem>
                          <SelectItem value="drums">Drums</SelectItem>
                          <SelectItem value="bass">Bass</SelectItem>
                          <SelectItem value="melody">Melody</SelectItem>
                          <SelectItem value="effect">Sound Effects</SelectItem>
                          <SelectItem value="stem">Stem</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="md:col-span-2">
                      <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea 
                          id="description" 
                          placeholder="Describe your sample" 
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="sampleType">File Type</Label>
                      <Select
                        value={formData.sampleType}
                        onValueChange={(value) => setFormData({...formData, sampleType: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select file type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mp3">MP3 File</SelectItem>
                          <SelectItem value="wav">WAV File</SelectItem>
                          <SelectItem value="stem">Stem Pack</SelectItem>
                          <SelectItem value="other">Other Format</SelectItem>
                        </SelectContent>
                      </Select>
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
                    
                    {uploadedFile && formData.audioUrl && (
                      <div className="md:col-span-2 bg-muted/30 p-4 rounded-md">
                        <div className="grid gap-2">
                          <Label>Audio Preview</Label>
                          {formData.sampleType !== 'stem' ? (
                            <audio 
                              src={formData.audioUrl} 
                              controls 
                              className="w-full" 
                            />
                          ) : (
                            <div className="flex items-center space-x-2 text-sm">
                              <FileText className="h-4 w-4" />
                              <span>{uploadedFile?.name} (Stem Pack - not previewable)</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
              </DialogClose>
              <Button 
                onClick={handleAddOrUpdate}
                disabled={!formData.audioUrl || !formData.title || !formData.description}
              >
                {selectedSample ? "Update Sample" : "Add Sample"}
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
        ) : samples.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="space-y-4">
              <Music className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <div>
                <p className="font-medium">No samples uploaded yet</p>
                <p className="text-sm text-muted-foreground mb-4">Upload MP3s, WAVs, or Stem packs to showcase your work</p>
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-primary to-primary/80"
                  onClick={() => setShowAddDialog(true)}
                >
                  <PlusCircle className="h-5 w-5 mr-2" />
                  Upload Your First Sample
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
                {categories.map(category => (
                  <Button
                    key={category.value}
                    variant={activeCategory === category.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveCategory(category.value)}
                    className={activeCategory === category.value ? 
                      "bg-primary text-primary-foreground" : ""}
                  >
                    {category.label}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {samples.map((sample) => (
              <Card key={sample.id} className="overflow-hidden">
                <div 
                  className="h-32 bg-gradient-to-br from-primary/10 to-primary/30 flex items-center justify-center"
                  style={{
                    backgroundImage: sample.imageUrl ? `url(${sample.imageUrl})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="text-center text-white">
                      <h3 className="font-semibold">{sample.title}</h3>
                      <div className="flex items-center justify-center space-x-2 mt-1">
                        <span className="text-xs bg-primary px-2 py-0.5 rounded">
                          {fileTypeDisplay(sample.sampleType || 'mp3')}
                        </span>
                        {sample.category && (
                          <span className="text-xs bg-black/50 px-2 py-0.5 rounded-sm">
                            {sample.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">{sample.description}</p>
                  <div className="mt-4 flex justify-between items-center">
                    {sample.sampleType !== 'stem' ? (
                      <audio 
                        src={sample.audioUrl} 
                        controls 
                        className="w-full h-8" 
                      />
                    ) : (
                      <div className="w-full flex items-center justify-between bg-muted/30 px-3 py-2 rounded">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">Stem Pack</span>
                        </div>
                        <Button variant="outline" size="sm">
                          Download
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-end gap-2 p-4 pt-0">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedSample(sample);
                      setFormData({
                        title: sample.title,
                        description: sample.description,
                        type: "sample",
                        audioUrl: sample.audioUrl,
                        imageUrl: sample.imageUrl || "",
                        category: sample.category || "general",
                        sampleType: sample.sampleType || "mp3"
                      });
                      setShowAddDialog(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this sample?")) {
                        deleteSampleMutation.mutate(sample.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function BeatsByGenreManager() {
  const { toast } = useToast();
  const [genre, setGenre] = useState("hip-hop");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedBeat, setSelectedBeat] = useState<Beat | null>(null);
  const [isPreviewUploading, setIsPreviewUploading] = useState(false);
  const [previewUploadProgress, setPreviewUploadProgress] = useState(0);
  const [isFullAudioUploading, setIsFullAudioUploading] = useState(false);
  const [fullAudioUploadProgress, setFullAudioUploadProgress] = useState(0);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    genre: string;
    bpm: number;
    price: number;
    previewUrl: string;
    fullAudioUrl: string;
    imageUrl: string;
    featured: boolean;
    licensingOptions: {
      basic: { price: number; description: string };
      premium: { price: number; description: string };
      exclusive: { price: number; description: string };
    };
    tags: string[];
    contractUrl: string;
  }>({
    title: "",
    description: "",
    genre: "hip-hop",
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
    tags: [],
    contractUrl: ""
  });
  
  // Fetch all beats
  const { data: allBeats = [], isLoading } = useQuery<Beat[]>({
    queryKey: ['/api/beats'],
  });
  
  // Filter beats by selected genre
  const filteredBeats = allBeats.filter(beat => beat.genre === genre);
  
  // Genres for selection
  const genres = [
    { value: "hip-hop", label: "Hip Hop" },
    { value: "rnb", label: "R&B" },
    { value: "pop", label: "Pop" },
    { value: "trap", label: "Trap" },
    { value: "dance", label: "Dance" },
    { value: "reggaeton", label: "Reggaeton" },
    { value: "drill", label: "Drill" },
    { value: "afrobeat", label: "Afrobeat" },
    { value: "lofi", label: "Lo-Fi" },
    { value: "rock", label: "Rock" },
    { value: "electronic", label: "Electronic" },
    { value: "other", label: "Other" }
  ];
  
  // Add beat mutation
  const addBeatMutation = useMutation({
    mutationFn: async (beat: any) => {
      return apiRequest("POST", "/api/beats", beat);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/beats'] });
      setShowAddDialog(false);
      resetForm();
      toast({
        title: "Beat added successfully",
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
  
  // Simulate preview file upload
  const simulatePreviewUpload = (file: File) => {
    setIsPreviewUploading(true);
    setPreviewUploadProgress(0);
    
    // Simulate progress
    const interval = setInterval(() => {
      setPreviewUploadProgress(prev => {
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
      setPreviewUploadProgress(100);
      setIsPreviewUploading(false);
      
      // Create a fake URL for demo purposes
      const fakeUrl = `https://storage.musiclifestudios.com/beats/${genre}/preview-${Date.now()}-${file.name.replace(/\s+/g, '-').toLowerCase()}`;
      
      // Update form data with the URL
      setFormData(prev => ({
        ...prev,
        previewUrl: fakeUrl
      }));
      
      toast({
        title: "Preview uploaded successfully",
        description: `${file.name} has been uploaded`,
      });
    }, 3000);
  };
  
  // Simulate full audio file upload
  const simulateFullAudioUpload = (file: File) => {
    setIsFullAudioUploading(true);
    setFullAudioUploadProgress(0);
    
    // Simulate progress
    const interval = setInterval(() => {
      setFullAudioUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 5;
      });
    }, 250);
    
    // Simulate completion after 4 seconds
    setTimeout(() => {
      clearInterval(interval);
      setFullAudioUploadProgress(100);
      setIsFullAudioUploading(false);
      
      // Create a fake URL for demo purposes
      const fakeUrl = `https://storage.musiclifestudios.com/beats/${genre}/full-${Date.now()}-${file.name.replace(/\s+/g, '-').toLowerCase()}`;
      
      // Update form data with the URL
      setFormData(prev => ({
        ...prev,
        fullAudioUrl: fakeUrl
      }));
      
      toast({
        title: "Full audio uploaded successfully",
        description: `${file.name} has been uploaded`,
      });
    }, 4000);
  };
  
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      genre: genre,
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
      tags: [],
      contractUrl: ""
    });
    setSelectedBeat(null);
  };
  
  const handleAddOrUpdate = () => {
    // Basic validation
    if (!formData.title || !formData.description || !formData.genre || !formData.previewUrl || !formData.fullAudioUrl) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedBeat) {
      // Update existing beat
      // Replace with actual update logic
      toast({
        title: "Beat updated successfully",
      });
      setShowAddDialog(false);
      resetForm();
    } else {
      // Add new beat
      addBeatMutation.mutate(formData);
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Beats by Genre</CardTitle>
          <CardDescription>Upload and manage your beats by genre</CardDescription>
        </div>
        <div className="flex space-x-2">
          <Select 
            value={genre} 
            onValueChange={setGenre}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select genre" />
            </SelectTrigger>
            <SelectContent>
              {genres.map(g => (
                <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add {genres.find(g => g.value === genre)?.label} Beat
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {selectedBeat ? "Edit Beat" : `Add New ${genres.find(g => g.value === genre)?.label} Beat`}
                </DialogTitle>
                <DialogDescription>
                  Upload a new beat to your marketplace in the {genres.find(g => g.value === genre)?.label} genre.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input 
                    id="title" 
                    placeholder="Enter beat title" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Describe your beat" 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="price">Base Price ($)</Label>
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
                </div>
                
                <FileUploader
                  label="Preview Audio"
                  description="Upload a short preview of your beat (MP3)"
                  accept="audio/mp3,audio/mpeg"
                  maxSize={10}
                  onFileSelected={simulatePreviewUpload}
                  uploading={isPreviewUploading}
                  uploadProgress={previewUploadProgress}
                  uploadSuccess={formData.previewUrl !== ""}
                />
                
                <FileUploader
                  label="Full Audio Track"
                  description="Upload the full beat (to be sold)"
                  accept="audio/*"
                  maxSize={100}
                  onFileSelected={simulateFullAudioUpload}
                  uploading={isFullAudioUploading}
                  uploadProgress={fullAudioUploadProgress}
                  uploadSuccess={formData.fullAudioUrl !== ""}
                />
                
                <div className="grid gap-2">
                  <Label htmlFor="imageUrl">Cover Image URL (optional)</Label>
                  <Input 
                    id="imageUrl" 
                    placeholder="Enter image URL" 
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="featured" 
                    checked={formData.featured}
                    onCheckedChange={(checked: boolean | "indeterminate") => setFormData({...formData, featured: checked === true})}
                  />
                  <Label htmlFor="featured">Feature this beat in the marketplace</Label>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input 
                    id="tags" 
                    placeholder="e.g. dark, melodic, 808s" 
                    value={formData.tags.join(', ')}
                    onChange={(e) => {
                      const tagArray: string[] = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                      setFormData({...formData, tags: tagArray});
                    }}
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" onClick={resetForm}>Cancel</Button>
                </DialogClose>
                <Button onClick={handleAddOrUpdate}>
                  {selectedBeat ? "Update Beat" : "Add Beat"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filteredBeats.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Music className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
            <p>No {genres.find(g => g.value === genre)?.label} beats uploaded yet.</p>
            <Button className="mt-4" variant="outline" onClick={() => setShowAddDialog(true)}>
              Add Your First {genres.find(g => g.value === genre)?.label} Beat
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBeats.map((beat) => (
              <Card key={beat.id} className="overflow-hidden">
                <div 
                  className="h-32 bg-gradient-to-br from-primary/10 to-primary/30 flex items-center justify-center"
                  style={{
                    backgroundImage: beat.imageUrl ? `url(${beat.imageUrl})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="text-center text-white">
                      <h3 className="font-semibold">{beat.title}</h3>
                      <span className="text-xs bg-primary px-2 py-0.5 rounded">
                        {genres.find(g => g.value === beat.genre)?.label} • {beat.bpm} BPM
                      </span>
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{beat.description}</p>
                  <div className="flex justify-between items-center">
                    <div>
                      <Badge variant={beat.featured ? "default" : "outline"}>
                        {beat.featured ? "Featured" : "Standard"}
                      </Badge>
                    </div>
                    <div className="text-md font-semibold">
                      ${(beat.price / 100).toFixed(2)}
                    </div>
                  </div>
                  <div className="mt-2">
                    <audio 
                      src={beat.previewUrl} 
                      controls 
                      className="w-full h-8" 
                    />
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-end gap-2 p-4 pt-0">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedBeat(beat);
                      setFormData({
                        title: beat.title,
                        description: beat.description,
                        genre: beat.genre,
                        bpm: beat.bpm,
                        price: beat.price,
                        previewUrl: beat.previewUrl,
                        fullAudioUrl: beat.fullAudioUrl,
                        imageUrl: beat.imageUrl || "",
                        featured: beat.featured || false,
                        licensingOptions: {
                          basic: { price: 2999, description: "Basic license" },
                          premium: { price: 6999, description: "Premium license" },
                          exclusive: { price: 19999, description: "Exclusive license" },
                          ...(typeof beat.licensingOptions === 'object' ? beat.licensingOptions : {})
                        },
                        tags: Array.isArray(beat.tags) ? beat.tags : [],
                        contractUrl: beat.contractUrl || ""
                      });
                      setShowAddDialog(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this beat?")) {
                        // Implement delete logic
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ServicesManager() {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 9900, // $99.00
    duration: 60, // 60 minutes
  });
  
  // Fetch all services
  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ['/api/services'],
  });
  
  // Add service mutation
  const addServiceMutation = useMutation({
    mutationFn: async (service: any) => {
      return apiRequest("POST", "/api/services", service);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      setShowAddDialog(false);
      resetForm();
      toast({
        title: "Service added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error adding service",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update service mutation
  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, service }: { id: number; service: any }) => {
      return apiRequest("PUT", `/api/services/${id}`, service);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      setShowAddDialog(false);
      resetForm();
      toast({
        title: "Service updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating service",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Delete service mutation
  const deleteServiceMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/services/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      toast({
        title: "Service deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting service",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: 9900,
      duration: 60,
    });
    setSelectedService(null);
  };
  
  const handleEdit = (service: Service) => {
    setSelectedService(service);
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
    });
    setShowAddDialog(true);
  };
  
  const handleAddOrUpdate = () => {
    // Basic validation
    if (!formData.name || !formData.description) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedService) {
      // Update existing service
      updateServiceMutation.mutate({
        id: selectedService.id,
        service: formData,
      });
    } else {
      // Add new service
      addServiceMutation.mutate(formData);
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Services</CardTitle>
          <CardDescription>Manage your service offerings</CardDescription>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedService ? "Edit Service" : "Add New Service"}
              </DialogTitle>
              <DialogDescription>
                Add or edit a service that clients can book.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Service Name</Label>
                <Input 
                  id="name" 
                  placeholder="e.g., Recording Session" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Describe the service" 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input 
                    id="price" 
                    type="number" 
                    placeholder="99.00" 
                    value={formData.price / 100}
                    onChange={(e) => setFormData({...formData, price: Math.round(parseFloat(e.target.value) * 100) || 0})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input 
                    id="duration" 
                    type="number" 
                    placeholder="60" 
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
              </DialogClose>
              <Button onClick={handleAddOrUpdate}>
                {selectedService ? "Update Service" : "Add Service"}
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
        ) : services.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
            <p>No services added yet.</p>
            <Button className="mt-4" variant="outline" onClick={() => setShowAddDialog(true)}>
              Add Your First Service
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell className="max-w-md truncate">{service.description}</TableCell>
                  <TableCell>${service.price / 100}</TableCell>
                  <TableCell>{service.duration} minutes</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(service)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-destructive"
                        onClick={() => deleteServiceMutation.mutate(service.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}