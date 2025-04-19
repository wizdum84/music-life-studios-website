import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Beat } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { PlayCircle, PauseCircle, Download, ShoppingCart } from "lucide-react";
import { formatPrice } from "@/lib/utils";

// Audio player for previewing beats
const BeatPlayer = ({ beat, isPlaying, onPlay, onPause, isLoading = false }: { 
  beat: Beat; 
  isPlaying: boolean; 
  onPlay: () => void; 
  onPause: () => void;
  isLoading?: boolean;
}) => {
  return (
    <div className="flex items-center gap-2 w-full">
      <button
        onClick={isPlaying ? onPause : onPlay}
        className={`rounded-full p-1 transition-all ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/10 cursor-pointer'}`}
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="relative w-12 h-12">
            <PlayCircle size={48} className="text-primary/50 absolute inset-0" />
            <svg className="animate-spin absolute inset-0 w-12 h-12 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : isPlaying ? (
          <PauseCircle size={48} className="text-primary" />
        ) : (
          <PlayCircle size={48} className="text-primary" />
        )}
      </button>
      <div className="w-full">
        <Slider 
          defaultValue={[0]} 
          max={100} 
          step={1} 
          className={`w-full ${isLoading ? 'opacity-50' : ''}`}
          disabled={isLoading}
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>00:00</span>
          {isLoading ? (
            <span className="inline-flex items-center">
              <span className="animate-pulse">Loading audio</span>
              <span className="ml-1 flex">
                <span className="animate-bounce h-1 w-1 bg-primary rounded-full mx-[1px] delay-75"></span>
                <span className="animate-bounce h-1 w-1 bg-primary rounded-full mx-[1px] delay-150"></span>
                <span className="animate-bounce h-1 w-1 bg-primary rounded-full mx-[1px] delay-300"></span>
              </span>
            </span>
          ) : (
            <span>03:45</span>
          )}
        </div>
      </div>
    </div>
  );
};

// Beat card for displaying individual beats
const BeatCard = ({ beat }: { beat: Beat }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState("basic");
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  
  // Create audio element when component mounts
  useEffect(() => {
    const audio = new Audio(beat.previewUrl || 'dummy-url');
    setAudioElement(audio);
    
    // Cleanup on unmount
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, [beat.previewUrl]);
  
  // Setup audio event listeners
  useEffect(() => {
    if (!audioElement) return;
    
    const handleAudioPlay = () => {
      setIsAudioLoading(false);
      setIsPlaying(true);
    };
    
    const handleAudioPause = () => {
      setIsPlaying(false);
    };
    
    const handleAudioEnded = () => {
      setIsPlaying(false);
    };
    
    const handleLoadStart = () => {
      setIsAudioLoading(true);
    };
    
    const handleCanPlay = () => {
      setIsAudioLoading(false);
    };
    
    const handleError = () => {
      setIsAudioLoading(false);
      console.error("Error loading audio file");
    };
    
    // Add event listeners
    audioElement.addEventListener('play', handleAudioPlay);
    audioElement.addEventListener('pause', handleAudioPause);
    audioElement.addEventListener('ended', handleAudioEnded);
    audioElement.addEventListener('loadstart', handleLoadStart);
    audioElement.addEventListener('canplay', handleCanPlay);
    audioElement.addEventListener('error', handleError);
    
    // Cleanup listeners on unmount or when audio element changes
    return () => {
      audioElement.removeEventListener('play', handleAudioPlay);
      audioElement.removeEventListener('pause', handleAudioPause);
      audioElement.removeEventListener('ended', handleAudioEnded);
      audioElement.removeEventListener('loadstart', handleLoadStart);
      audioElement.removeEventListener('canplay', handleCanPlay);
      audioElement.removeEventListener('error', handleError);
    };
  }, [audioElement]);
  
  // Get price based on selected license
  const getPrice = () => {
    const options = beat.licensingOptions as any;
    return options[selectedLicense]?.price || beat.price;
  };
  
  // Get features based on license type 
  const getLicenseFeatures = (type: string) => {
    const features = [];
    const options = beat.licensingOptions as any;
    
    if (type === "basic") {
      features.push("MP3 format only");
      features.push("Limited to 1,000 streams");
      features.push("Personal use only");
    } else if (type === "premium") {
      features.push("WAV + MP3 formats");
      features.push("Up to 5,000 streams");
      features.push("Commercial use");
      features.push("Can be sold with credit");
    } else if (type === "exclusive") {
      features.push("All audio formats + stems");
      features.push("Unlimited streams");
      features.push("Full ownership rights");
      features.push("No credit required");
    }
    
    return features;
  };
  
  // Play/pause handlers
  const handlePlay = () => {
    if (!audioElement) return;
    
    // Stop all other playing audio elements first
    document.querySelectorAll('audio').forEach(audio => {
      if (audio !== audioElement) audio.pause();
    });
    
    // Try to play this audio
    setIsAudioLoading(true);
    audioElement.play().catch(error => {
      console.error("Error playing audio:", error);
      setIsAudioLoading(false);
    });
  };
  
  const handlePause = () => {
    if (!audioElement) return;
    audioElement.pause();
  };
  
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md border-muted hover:border-primary/30">
      <div 
        className="h-44 bg-gradient-to-br from-primary/10 to-primary/30 flex items-center justify-center relative" 
        style={{
          backgroundImage: beat.imageUrl ? `url(${beat.imageUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-white text-xl font-semibold">{beat.title}</h3>
            {beat.featured && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded mt-1 inline-block">
                Featured
              </span>
            )}
          </div>
        </div>
      </div>
      
      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-center">
          <div>
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">{beat.genre}</span>
            <p className="font-medium mt-1">{beat.bpm} BPM</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Starting at</p>
            <p className="font-semibold text-primary">{formatPrice(beat.price)}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <BeatPlayer 
          beat={beat} 
          isPlaying={isPlaying} 
          onPlay={handlePlay} 
          onPause={handlePause}
          isLoading={isAudioLoading}
        />
        
        <div className="mt-5">
          <Tabs defaultValue="basic" onValueChange={setSelectedLicense} className="border rounded-md p-2">
            <TabsList className="grid grid-cols-3 w-full mb-2">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="premium">Premium</TabsTrigger>
              <TabsTrigger value="exclusive">Exclusive</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="mt-2 space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Basic License</h4>
                <p className="font-semibold text-primary">{formatPrice((beat.licensingOptions as any).basic.price)}</p>
              </div>
              <ul className="text-sm space-y-1">
                {getLicenseFeatures("basic").map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    {feature}
                  </li>
                ))}
              </ul>
            </TabsContent>
            
            <TabsContent value="premium" className="mt-2 space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Premium License</h4>
                <p className="font-semibold text-primary">{formatPrice((beat.licensingOptions as any).premium.price)}</p>
              </div>
              <ul className="text-sm space-y-1">
                {getLicenseFeatures("premium").map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    {feature}
                  </li>
                ))}
              </ul>
            </TabsContent>
            
            <TabsContent value="exclusive" className="mt-2 space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Exclusive License</h4>
                <p className="font-semibold text-primary">{formatPrice((beat.licensingOptions as any).exclusive.price)}</p>
              </div>
              <ul className="text-sm space-y-1">
                {getLicenseFeatures("exclusive").map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    {feature}
                  </li>
                ))}
              </ul>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Button className="w-full bg-primary hover:bg-primary-600">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Purchase {selectedLicense.charAt(0).toUpperCase() + selectedLicense.slice(1)} License
        </Button>
      </CardFooter>
    </Card>
  );
};

// Filter sidebar
const FilterSidebar = ({ 
  selectedGenre, 
  onGenreChange, 
  genres 
}: { 
  selectedGenre: string | null; 
  onGenreChange: (genre: string | null) => void; 
  genres: string[] 
}) => {
  return (
    <div className="w-full lg:w-64 p-5 bg-muted/30 rounded-lg border border-muted-foreground/10 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Find Your Beat</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs"
          onClick={() => onGenreChange(null)}
        >
          Reset Filters
        </Button>
      </div>
      
      <div className="space-y-6">
        <div>
          <div className="flex items-center mb-3">
            <div className="w-1 h-4 bg-primary rounded mr-2"></div>
            <h4 className="font-medium">Genre</h4>
          </div>
          <div className="space-y-1.5 pl-3">
            <button
              className={`block w-full text-left py-1.5 px-3 rounded-md transition-colors 
                ${selectedGenre === null 
                  ? 'bg-primary text-primary-foreground font-medium' 
                  : 'hover:bg-muted text-foreground/80'}`}
              onClick={() => onGenreChange(null)}
            >
              All Genres
            </button>
            {genres.map(genre => (
              <button
                key={genre}
                className={`block w-full text-left py-1.5 px-3 rounded-md transition-colors
                  ${selectedGenre === genre 
                    ? 'bg-primary text-primary-foreground font-medium' 
                    : 'hover:bg-muted text-foreground/80'}`}
                onClick={() => onGenreChange(genre)}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <div className="flex items-center mb-3">
            <div className="w-1 h-4 bg-primary rounded mr-2"></div>
            <h4 className="font-medium">BPM Range</h4>
          </div>
          <div className="px-3 py-2">
            <Slider defaultValue={[60, 180]} min={60} max={180} step={1} className="mb-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>60</span>
              <span>180</span>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs font-medium">Selected: 60 - 180 BPM</span>
            </div>
          </div>
        </div>
        
        <div>
          <div className="flex items-center mb-3">
            <div className="w-1 h-4 bg-primary rounded mr-2"></div>
            <h4 className="font-medium">Price Range</h4>
          </div>
          <div className="px-3 py-2">
            <Slider defaultValue={[50]} min={0} max={100} step={1} className="mb-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>$0</span>
              <span>$500+</span>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs font-medium">Max: $250</span>
            </div>
          </div>
        </div>
        
        <div className="pt-2">
          <Button className="w-full" variant="outline">
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function Beats() {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  
  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  // Fetch all beats
  const { data: beats = [], isLoading } = useQuery<Beat[]>({
    queryKey: ['/api/beats'],
    enabled: true,
  });
  
  // Get unique genres from beats
  const genres = Array.from(new Set(beats.map(beat => beat.genre)));
  
  // Filter beats by selected genre
  const filteredBeats = selectedGenre 
    ? beats.filter(beat => beat.genre === selectedGenre) 
    : beats;
  
  // Featured beats
  const featuredBeats = beats.filter(beat => beat.featured);
  
  return (
    <div className="py-16 container mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary-600 bg-clip-text text-transparent">Beats & Licensing</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Browse our collection of premium beats available for licensing. Find the perfect sound for your next project.
        </p>
        <div className="mt-6 bg-muted/30 p-5 rounded-lg max-w-3xl mx-auto">
          <h3 className="text-xl font-semibold mb-2">How It Works</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="p-3">
              <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center mb-2">
                <span className="font-semibold">1</span>
              </div>
              <h4 className="font-medium mb-1">Browse & Listen</h4>
              <p className="text-sm">Preview beats and find the perfect match for your project</p>
            </div>
            <div className="p-3">
              <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center mb-2">
                <span className="font-semibold">2</span>
              </div>
              <h4 className="font-medium mb-1">Choose License</h4>
              <p className="text-sm">Select from Basic, Premium or Exclusive ownership options</p>
            </div>
            <div className="p-3">
              <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center mb-2">
                <span className="font-semibold">3</span>
              </div>
              <h4 className="font-medium mb-1">Download & Create</h4>
              <p className="text-sm">Get high-quality files instantly after purchase</p>
            </div>
          </div>
        </div>
      </div>

      {featuredBeats.length > 0 && (
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Featured Beats</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredBeats.map((beat: Beat) => (
              <BeatCard key={beat.id} beat={beat} />
            ))}
          </div>
        </div>
      )}
      
      <div className="flex flex-col lg:flex-row gap-8">
        <FilterSidebar 
          selectedGenre={selectedGenre} 
          onGenreChange={setSelectedGenre} 
          genres={genres} 
        />
        
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-6">All Beats</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <Card key={i} className="animate-pulse">
                  <div className="h-40 bg-muted"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredBeats.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">
              No beats found matching your filters. Try adjusting your criteria.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredBeats.map((beat: Beat) => (
                <BeatCard key={beat.id} beat={beat} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}