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
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 bg-card border mt-2">
          <TabsTrigger value="tracks">Portfolio Tracks</TabsTrigger>
          <TabsTrigger value="samples">Sample Library</TabsTrigger>
          <TabsTrigger value="beats">Beat Marketplace</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tracks" className="mt-0">
          <TracksManager />
        </TabsContent>
        
        <TabsContent value="samples" className="mt-0">
          <SamplesManager />
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
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Portfolio Tracks</CardTitle>
          <CardDescription>Manage tracks showcasing your studio work</CardDescription>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-primary/80">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Track
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedTrack ? "Edit Track" : "Add New Track"}
              </DialogTitle>
              <DialogDescription>
                Add a track to showcase your studio work
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
  const [previewUploadProgress, setPreviewUploadProgress] = useState(0);
  const [fullAudioUploadProgress, setFullAudioUploadProgress] = useState(0);
  const [activeGenre, setActiveGenre] = useState<string>("all");
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
  const { data: allBeats = [], isLoading } = useQuery<Beat[]>({
    queryKey: ['/api/beats'],
  });
  
  // Filter beats by genre
  const beats = activeGenre === 'all' 
    ? allBeats 
    : allBeats.filter(beat => beat.genre === activeGenre);
    
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
                        onCheckedChange={(checked) => 
                          setFormData({...formData, featured: checked === true})
                        }
                      />
                      <label
                        htmlFor="featured"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Feature this beat on the marketplace
                      </label>
                    </div>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
              </DialogClose>
              <Button 
                onClick={handleAddOrUpdate}
                disabled={!formData.title || !formData.description || !formData.genre || !formData.previewUrl || !formData.fullAudioUrl}
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
            <div className="mb-6">
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
            
            {beats.length === 0 ? (
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
          </>
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
  const [activeCategory, setActiveCategory] = useState<string>("all");
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
  const { data: allSamples = [], isLoading } = useQuery<Track[]>({
    queryKey: ['/api/tracks'],
    select: (tracks) => tracks.filter(track => track.type === 'sample')
  });
  
  // Filter samples by category
  const samples = activeCategory === 'all' 
    ? allSamples 
    : allSamples.filter(sample => sample.category === activeCategory);
  
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
                          <SelectItem value="effect">Effects</SelectItem>
                          <SelectItem value="stem">Stems</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="md:col-span-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea 
                        id="description" 
                        placeholder="Describe this sample" 
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="min-h-[100px]"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <div className="bg-muted/20 p-3 rounded-md mt-2">
                        <div className="mb-2 text-sm font-medium flex items-center gap-2">
                          <Badge>{fileTypeDisplay(fileType)}</Badge>
                          {uploadedFile && <span>{uploadedFile.name}</span>}
                        </div>
                        {formData.audioUrl && (
                          <audio src={formData.audioUrl} controls className="w-full" />
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
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
                disabled={!formData.title || !formData.description || !formData.audioUrl}
                className="bg-gradient-to-r from-primary to-primary/80 ml-2"
              >
                {selectedSample ? "Update Sample" : "Add Sample"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent>
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
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : samples.length === 0 && activeCategory === 'all' ? (
          <div className="text-center py-8 text-muted-foreground">
            <Music className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
            <p>No samples uploaded yet.</p>
            <Button className="mt-4" variant="outline" onClick={() => setShowAddDialog(true)}>
              Upload Your First Sample
            </Button>
          </div>
        ) : samples.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No samples found in the "{categories.find(c => c.value === activeCategory)?.label}" category.</p>
            <Button 
              variant="outline"
              className="mt-4"
              onClick={() => setActiveCategory('all')}
            >
              View All Categories
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {samples.map((sample) => (
              <Card key={sample.id} className="overflow-hidden">
                <div className="p-4 border-b">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">{sample.title}</h3>
                    <Badge variant="outline">{fileTypeDisplay(sample.sampleType || 'other')}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{sample.description}</p>
                  <div>
                    <audio 
                      src={sample.audioUrl} 
                      controls 
                      className="w-full h-8" 
                    />
                  </div>
                </div>
                
                <div className="bg-muted/10 px-4 py-3 flex justify-between items-center">
                  <Badge variant="secondary">
                    {categories.find(c => c.value === sample.category)?.label || 'General'}
                  </Badge>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-destructive"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this sample?")) {
                          deleteSampleMutation.mutate(sample.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
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
