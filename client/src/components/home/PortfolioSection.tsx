import { useState } from "react";
import { Track } from "@shared/schema";
import AudioPlayer from "@/components/audio/AudioPlayer";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Music } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PortfolioSectionProps {
  tracks: Track[];
  isLoading: boolean;
}

export default function PortfolioSection({ tracks, isLoading }: PortfolioSectionProps) {
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  
  const handleTrackSelect = (track: Track) => {
    setSelectedTrack(track);
  };
  
  return (
    <section id="portfolio" className="bg-[#1d1d1d] py-20 text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="mb-4 text-3xl font-black md:text-4xl">Portfolio</h2>
          <p className="mx-auto max-w-2xl text-lg text-white/65">
            Listen to some of my recent work across various genres and projects.
          </p>
        </div>
        
        {/* Audio Player Component */}
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <Card className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex flex-col md:flex-row gap-6 items-center mb-4">
                <div className="w-full md:w-1/4">
                  <Skeleton className="aspect-square w-full rounded-md" />
                </div>
                <div className="w-full md:w-3/4">
                  <Skeleton className="h-7 w-40 mb-1" />
                  <Skeleton className="h-5 w-64 mb-4" />
                  
                  <Skeleton className="mb-4 h-2 w-full rounded-full" />
                  
                  <div className="flex justify-between text-sm mb-4">
                    <Skeleton className="h-4 w-10" />
                    <Skeleton className="h-4 w-10" />
                  </div>
                  
                  <div className="flex justify-center space-x-6">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <AudioPlayer 
              track={selectedTrack || (tracks.length > 0 ? tracks[0] : null)} 
              className="mb-8"
            />
          )}
          
          {/* Portfolio Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isLoading ? (
              Array(4).fill(0).map((_, index) => (
                <Card key={index} className="bg-white rounded-lg shadow-md p-5">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-16 h-16 rounded-md flex-shrink-0" />
                    <div>
                      <Skeleton className="h-6 w-32 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="ml-auto">
                      <Skeleton className="w-10 h-10 rounded-full" />
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              tracks.map(track => (
                <Card 
                  key={track.id} 
                  className={`rounded-none border-2 border-[#6d4918] bg-[#141414] p-5 text-white shadow-none transition-transform hover:-translate-y-1 hover:shadow-[8px_8px_0_#8a5a1c] ${
                    selectedTrack?.id === track.id ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <CardContent className="p-0">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-primary/10 rounded-md flex-shrink-0 flex items-center justify-center">
                        <Music className="text-primary text-xl" />
                      </div>
                      <div>
                        <h4 className="font-medium text-lg">{track.title}</h4>
                        <p className="text-sm text-white/55">{track.description}</p>
                      </div>
                      <div className="ml-auto">
                        <button 
                          className="w-10 h-10 rounded-full bg-primary hover:bg-primary-600 transition-colors flex items-center justify-center"
                          onClick={() => handleTrackSelect(track)}
                        >
                          <Play className="h-5 w-5 text-white" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          
          <div className="text-center mt-10">
            <a href="#" className="inline-flex items-center text-primary hover:text-primary-600 font-medium transition-colors">
              <span>See more portfolio projects</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
