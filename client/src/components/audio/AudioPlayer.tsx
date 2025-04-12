import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { Track } from "@shared/schema";
import { useAudio } from "@/hooks/useAudio";

interface AudioPlayerProps {
  track: Track | null;
  className?: string;
}

export default function AudioPlayer({ track, className = "" }: AudioPlayerProps) {
  const { 
    playing, 
    currentTime, 
    duration, 
    togglePlayPause, 
    seek, 
    load 
  } = useAudio();
  
  // Format time in MM:SS
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Load track when it changes
  useEffect(() => {
    if (track) {
      load(track.audioUrl);
    }
  }, [track, load]);
  
  if (!track) {
    return (
      <Card className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center py-8">
          <p className="text-muted-foreground">No audio track selected</p>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="w-full md:w-1/4">
            {track.imageUrl ? (
              <div 
                className="w-full aspect-square rounded-md shadow-sm bg-cover bg-center"
                style={{ backgroundImage: `url(${track.imageUrl})` }}
              />
            ) : (
              <div className="w-full aspect-square rounded-md shadow-sm bg-primary/10 flex items-center justify-center">
                <Play className="h-12 w-12 text-primary" />
              </div>
            )}
          </div>
          
          <div className="w-full md:w-3/4">
            <h3 className="font-semibold text-xl mb-1">{track.title}</h3>
            <p className="text-muted-foreground mb-4">{track.description}</p>
            
            <div className="mb-4">
              <Slider
                defaultValue={[0]}
                value={[currentTime]}
                max={duration || 100}
                step={1}
                onValueChange={(value) => seek(value[0])}
                className="my-4"
              />
            </div>
            
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            
            <div className="flex justify-center space-x-6 mt-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-foreground hover:text-primary transition-colors"
              >
                <SkipBack className="h-6 w-6" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="text-foreground hover:text-primary transition-colors"
                onClick={togglePlayPause}
              >
                {playing ? (
                  <Pause className="h-8 w-8" />
                ) : (
                  <Play className="h-8 w-8" />
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-foreground hover:text-primary transition-colors"
              >
                <SkipForward className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
