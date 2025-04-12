import { useState, useEffect, useRef, useCallback } from "react";

export function useAudio() {
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Create audio element on mount
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    
    // Event listeners
    const setAudioData = () => {
      setDuration(audio.duration);
    };
    
    const setAudioTime = () => {
      setCurrentTime(audio.currentTime);
    };
    
    const onEnded = () => {
      setPlaying(false);
      setCurrentTime(0);
    };
    
    // Add event listeners
    audio.addEventListener("loadeddata", setAudioData);
    audio.addEventListener("timeupdate", setAudioTime);
    audio.addEventListener("ended", onEnded);
    
    // Cleanup event listeners on unmount
    return () => {
      audio.pause();
      audio.removeEventListener("loadeddata", setAudioData);
      audio.removeEventListener("timeupdate", setAudioTime);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);
  
  // Load audio source
  const load = useCallback((src: string) => {
    if (!audioRef.current) return;
    
    // Only reload if source changed
    if (audioSrc !== src) {
      setAudioSrc(src);
      audioRef.current.src = src;
      audioRef.current.load();
      setPlaying(false);
      setCurrentTime(0);
    }
  }, [audioSrc]);
  
  // Play/pause toggle
  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;
    
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      // If at the end, reset to beginning
      if (audioRef.current.currentTime === audioRef.current.duration) {
        audioRef.current.currentTime = 0;
      }
      audioRef.current.play().catch(error => {
        console.error("Error playing audio:", error);
      });
      setPlaying(true);
    }
  }, [playing]);
  
  // Seek to position
  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;
    
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);
  
  // Set volume (0 to 1)
  const setVolume = useCallback((volume: number) => {
    if (!audioRef.current) return;
    
    const newVolume = Math.min(1, Math.max(0, volume));
    audioRef.current.volume = newVolume;
  }, []);
  
  // Mute/unmute
  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    
    audioRef.current.muted = !audioRef.current.muted;
  }, []);
  
  // Stop audio
  const stop = useCallback(() => {
    if (!audioRef.current) return;
    
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setPlaying(false);
    setCurrentTime(0);
  }, []);
  
  return {
    playing,
    duration,
    currentTime,
    load,
    togglePlayPause,
    seek,
    setVolume,
    toggleMute,
    stop
  };
}
