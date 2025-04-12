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
const BeatPlayer = ({ beat, isPlaying, onPlay, onPause }: { 
  beat: Beat; 
  isPlaying: boolean; 
  onPlay: () => void; 
  onPause: () => void 
}) => {
  return (
    <div className="flex items-center gap-2 w-full">
      <button
        onClick={isPlaying ? onPause : onPlay}
        className="rounded-full hover:bg-primary/10 p-1 transition-colors"
      >
        {isPlaying ? (
          <PauseCircle size={48} className="text-primary" />
        ) : (
          <PlayCircle size={48} className="text-primary" />
        )}
      </button>
      <div className="w-full">
        <Slider defaultValue={[0]} max={100} step={1} className="w-full" />
        <div className="text-xs text-muted-foreground mt-1">00:00 / 03:45</div>
      </div>
    </div>
  );
};

// Beat card for displaying individual beats
const BeatCard = ({ beat }: { beat: Beat }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState("basic");
  
  // Get price based on selected license
  const getPrice = () => {
    const options = beat.licensingOptions as any;
    return options[selectedLicense]?.price || beat.price;
  };
  
  // Play/pause handlers
  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <div 
        className="h-40 bg-gradient-to-br from-primary/10 to-primary/30 flex items-center justify-center" 
        style={{
          backgroundImage: beat.imageUrl ? `url(${beat.imageUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <h3 className="text-white text-xl font-semibold">{beat.title}</h3>
        </div>
      </div>
      
      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm text-muted-foreground">{beat.genre}</span>
            <p className="font-medium">{beat.bpm} BPM</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Starting at</p>
            <p className="font-medium text-primary">{formatPrice(beat.price)}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <BeatPlayer 
          beat={beat} 
          isPlaying={isPlaying} 
          onPlay={handlePlay} 
          onPause={handlePause} 
        />
        
        <div className="mt-4">
          <Tabs defaultValue="basic" onValueChange={setSelectedLicense}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="premium">Premium</TabsTrigger>
              <TabsTrigger value="exclusive">Exclusive</TabsTrigger>
            </TabsList>
            <TabsContent value="basic" className="mt-2 text-sm">
              <p>{(beat.licensingOptions as any).basic.description}</p>
              <p className="font-medium mt-1">{formatPrice((beat.licensingOptions as any).basic.price)}</p>
            </TabsContent>
            <TabsContent value="premium" className="mt-2 text-sm">
              <p>{(beat.licensingOptions as any).premium.description}</p>
              <p className="font-medium mt-1">{formatPrice((beat.licensingOptions as any).premium.price)}</p>
            </TabsContent>
            <TabsContent value="exclusive" className="mt-2 text-sm">
              <p>{(beat.licensingOptions as any).exclusive.description}</p>
              <p className="font-medium mt-1">{formatPrice((beat.licensingOptions as any).exclusive.price)}</p>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Button className="w-full">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Purchase {selectedLicense} License
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
    <div className="w-full lg:w-64 p-4 bg-muted/30 rounded-lg">
      <h3 className="font-medium text-lg mb-4">Filters</h3>
      
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-2">Genre</h4>
        <div className="space-y-2">
          <button
            className={`block w-full text-left py-1 px-2 rounded ${selectedGenre === null ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            onClick={() => onGenreChange(null)}
          >
            All Genres
          </button>
          {genres.map(genre => (
            <button
              key={genre}
              className={`block w-full text-left py-1 px-2 rounded ${selectedGenre === genre ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              onClick={() => onGenreChange(genre)}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>
      
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-2">BPM Range</h4>
        <div className="px-2">
          <Slider defaultValue={[60, 180]} min={60} max={180} step={1} />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>60</span>
            <span>180</span>
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-medium mb-2">Price</h4>
        <div className="px-2">
          <Slider defaultValue={[50]} min={0} max={100} step={1} />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>$0</span>
            <span>$500+</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Beats() {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  
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
        <h1 className="text-4xl font-bold mb-2">Beats & Licensing</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Browse our collection of premium beats available for licensing. Find the perfect sound for your next project.
        </p>
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