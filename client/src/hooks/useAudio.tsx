import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

interface AudioContextValue {
  playing: boolean;
  duration: number;
  currentTime: number;
  audioSrc: string | null;
  activeTitle: string | null;
  volume: number;
  muted: boolean;
  hasStarted: boolean;
  load: (src: string, title?: string) => void;
  play: (src?: string, title?: string) => Promise<void>;
  pause: () => void;
  togglePlayPause: (src?: string, title?: string) => void;
  seek: (time: number) => void;
  skip: (seconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  stop: () => void;
}

const AudioContext = createContext<AudioContextValue | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sourceRef = useRef<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [activeTitle, setActiveTitle] = useState<string | null>(null);
  const [volume, setVolumeState] = useState(1);
  const [muted, setMuted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;

    const onLoadedMetadata = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onDurationChange = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      setCurrentTime(Number.isFinite(audio.duration) ? audio.duration : 0);
    };
    const onVolumeChange = () => {
      setVolumeState(audio.volume);
      setMuted(audio.muted);
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("volumechange", onVolumeChange);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("volumechange", onVolumeChange);
      audioRef.current = null;
    };
  }, []);

  const load = useCallback((src: string, title?: string) => {
    const audio = audioRef.current;
    if (!audio || !src) return;
    if (sourceRef.current === src) {
      if (title) setActiveTitle(title);
      return;
    }

    audio.pause();
    audio.src = src;
    audio.load();
    sourceRef.current = src;
    setAudioSrc(src);
    setActiveTitle(title || null);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const play = useCallback(async (src?: string, title?: string) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (src && sourceRef.current !== src) load(src, title);
    if (title) setActiveTitle(title);

    try {
      if (audio.ended) audio.currentTime = 0;
      await audio.play();
      setHasStarted(true);
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  }, [load]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const togglePlayPause = useCallback((src?: string, title?: string) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (src && sourceRef.current !== src) {
      void play(src, title);
      return;
    }
    if (audio.paused) void play(undefined, title);
    else pause();
  }, [pause, play]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const max = Number.isFinite(audio.duration) ? audio.duration : Math.max(time, 0);
    const nextTime = Math.min(Math.max(time, 0), max);
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  }, []);

  const skip = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    seek(audio.currentTime + seconds);
  }, [seek]);

  const setVolume = useCallback((nextVolume: number) => {
    const audio = audioRef.current;
    const next = Math.min(1, Math.max(0, nextVolume));
    setVolumeState(next);
    if (audio) {
      audio.volume = next;
      if (next > 0) audio.muted = false;
    }
    setMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setMuted(audio.muted);
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setPlaying(false);
    setCurrentTime(0);
    setHasStarted(false);
  }, []);

  return (
    <AudioContext.Provider value={{
      playing, duration, currentTime, audioSrc, activeTitle, volume, muted, hasStarted,
      load, play, pause, togglePlayPause, seek, skip, setVolume, toggleMute, stop,
    }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) throw new Error("useAudio must be used inside AudioProvider");
  return context;
}
