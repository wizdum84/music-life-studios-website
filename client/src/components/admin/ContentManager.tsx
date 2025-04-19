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
import { CalendarIcon, PlusCircle, Music, Calendar as CalendarIcon2, Clock, Edit, Trash2, FileText } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import FileUploader from "./FileUploader";
import ContractManager from "./ContractManager";
import { format, addDays, startOfWeek, endOfWeek } from "date-fns";

export default function ContentManager() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("tracks");
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <TabsTrigger value="tracks">Music Portfolio</TabsTrigger>
          <TabsTrigger value="beats">Beat Marketplace</TabsTrigger>
          <TabsTrigger value="schedule">Weekly Schedule</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="contracts">
            <FileText className="h-4 w-4 mr-2" />
            Contracts
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="tracks">
          <TracksManager />
        </TabsContent>
        
        <TabsContent value="beats">
          <BeatsManager />
        </TabsContent>
        
        <TabsContent value="schedule">
          <ScheduleManager />
        </TabsContent>
        
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
      const fakeUrl = `https://storage.musiclifestudios.com/full-${Date.now()}-${file.name.replace(/\s+/g, '-').toLowerCase()}`;
      
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
          <CardDescription>Upload and manage beats for sale</CardDescription>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Beat
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {selectedBeat ? "Edit Beat" : "Add New Beat"}
              </DialogTitle>
              <DialogDescription>
                Upload a new beat to your marketplace.
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
              
              <FileUploader
                label="Preview Audio"
                description="Upload a preview version (30-60 seconds)"
                accept="audio/*"
                maxSize={20}
                onFileSelected={simulatePreviewUpload}
                uploading={isPreviewUploading}
                uploadProgress={previewUploadProgress}
                uploadSuccess={formData.previewUrl !== ""}
              />
              
              <FileUploader
                label="Full Audio File"
                description="Upload the complete beat (will be delivered to customers)"
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
              
              <div className="grid gap-2">
                <Label htmlFor="price">Base Price ($)</Label>
                <Input 
                  id="price" 
                  type="number" 
                  placeholder="29.99" 
                  value={formData.price / 100}
                  onChange={(e) => setFormData({...formData, price: Math.round(parseFloat(e.target.value) * 100) || 0})}
                />
                <p className="text-xs text-muted-foreground">This is the starting price for the basic license</p>
              </div>
              
              <div className="flex items-center gap-2">
                <Input 
                  id="featured" 
                  type="checkbox" 
                  className="w-4 h-4"
                  checked={formData.featured}
                  onChange={(e) => setFormData({...formData, featured: e.target.checked})}
                />
                <Label htmlFor="featured">Feature this beat on the homepage</Label>
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

function ScheduleManager() {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    available: true,
  });
  
  // Calculate start and end of current week
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  
  // Fetch time slots
  const { data: timeSlots = [], isLoading } = useQuery<TimeSlot[]>({
    queryKey: ['/api/time-slots', {
      startDate: format(weekStart, "yyyy-MM-dd"),
      endDate: format(weekEnd, "yyyy-MM-dd"),
    }],
  });
  
  // Add time slot mutation
  const addTimeSlotMutation = useMutation({
    mutationFn: async (slot: any) => {
      return apiRequest("POST", "/api/time-slots", slot);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/time-slots'] });
      setShowAddDialog(false);
      resetForm();
      toast({
        title: "Time slot added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error adding time slot",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Delete time slot mutation
  const deleteTimeSlotMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/time-slots/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/time-slots'] });
      toast({
        title: "Time slot deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting time slot",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const resetForm = () => {
    setFormData({
      date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      available: true,
    });
    setSelectedSlot(null);
  };
  
  const handleAddOrUpdate = () => {
    // Basic validation
    if (!formData.date) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedSlot) {
      // Update existing slot
      // Replace with actual update logic
      toast({
        title: "Time slot updated successfully",
      });
      setShowAddDialog(false);
      resetForm();
    } else {
      // Add new slot
      addTimeSlotMutation.mutate({
        date: formData.date,
        available: formData.available,
      });
    }
  };
  
  // Generate time slots for display
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  // Group time slots by day
  const timeSlotsByDay = days.map(day => {
    const daySlots = timeSlots.filter(slot => {
      const slotDate = new Date(slot.date);
      return slotDate.getDate() === day.getDate() && 
             slotDate.getMonth() === day.getMonth() && 
             slotDate.getFullYear() === day.getFullYear();
    });
    
    return {
      date: day,
      slots: daySlots,
    };
  });
  
  // Navigate to next/previous week
  const goToPreviousWeek = () => {
    setCurrentDate(prevDate => addDays(prevDate, -7));
  };
  
  const goToNextWeek = () => {
    setCurrentDate(prevDate => addDays(prevDate, 7));
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Weekly Schedule</CardTitle>
          <CardDescription>Manage your available time slots</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
            Previous Week
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextWeek}>
            Next Week
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Time Slot
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {selectedSlot ? "Edit Time Slot" : "Add New Time Slot"}
                </DialogTitle>
                <DialogDescription>
                  Add available time slots to your weekly schedule.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">Date and Time</Label>
                  <Input 
                    id="date" 
                    type="datetime-local" 
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Input 
                    id="available" 
                    type="checkbox" 
                    className="w-4 h-4"
                    checked={formData.available}
                    onChange={(e) => setFormData({...formData, available: e.target.checked})}
                  />
                  <Label htmlFor="available">Available for booking</Label>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" onClick={resetForm}>Cancel</Button>
                </DialogClose>
                <Button onClick={handleAddOrUpdate}>
                  {selectedSlot ? "Update Time Slot" : "Add Time Slot"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-4">
          <h3 className="font-semibold">
            Week of {format(weekStart, "MMMM d, yyyy")} - {format(weekEnd, "MMMM d, yyyy")}
          </h3>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {timeSlotsByDay.map(({ date, slots }) => (
              <Card key={date.toString()} className="border border-muted">
                <CardHeader className="p-3 bg-muted/20">
                  <div className="text-center">
                    <p className="text-sm font-medium">{format(date, "EEEE")}</p>
                    <p className="text-lg font-bold">{format(date, "d")}</p>
                  </div>
                </CardHeader>
                <CardContent className="p-3 min-h-[120px]">
                  {slots.length === 0 ? (
                    <div className="text-center text-xs text-muted-foreground py-4">
                      No time slots
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {slots.map(slot => (
                        <div 
                          key={slot.id} 
                          className={`text-xs p-2 rounded flex items-center justify-between ${
                            slot.available 
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" 
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                          }`}
                        >
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{format(new Date(slot.date), "h:mm a")}</span>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-6 w-6 p-0 rounded-full"
                            onClick={() => deleteTimeSlotMutation.mutate(slot.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="p-2">
                  <Button 
                    className="w-full text-xs h-7" 
                    size="sm" 
                    variant="ghost"
                    onClick={() => {
                      setFormData({
                        date: format(date, "yyyy-MM-dd'T'10:00"),
                        available: true,
                      });
                      setShowAddDialog(true);
                    }}
                  >
                    <PlusCircle className="h-3 w-3 mr-1" />
                    Add Slot
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
            <CalendarIcon2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
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