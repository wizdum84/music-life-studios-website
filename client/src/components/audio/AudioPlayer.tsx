import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { Track } from "@shared/schema";
import { useAudio } from "@/hooks/useAudio";

interface AudioPlayerProps {
  track: Track | null;
  className?: string;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function AudioPlayer({ track, className = "" }: AudioPlayerProps) {
  const { audioSrc, playing, currentTime, duration, volume, muted, togglePlayPause, seek, skip, load, setVolume, toggleMute } = useAudio();

  useEffect(() => {
    if (!track) return;
    // Do not replace another preview that is already playing during navigation.
    if (!audioSrc || !playing || audioSrc === track.audioUrl) load(track.audioUrl, track.title);
  }, [track, audioSrc, playing, load]);

  if (!track) {
    return (
      <Card className={`border-2 border-[#6d4918] bg-[#141414] p-6 text-white ${className}`}>
        <div className="py-8 text-center text-white/60">No audio track selected</div>
      </Card>
    );
  }

  const isActive = audioSrc === track.audioUrl;
  const activeDuration = isActive ? duration : 0;
  const activeTime = isActive ? currentTime : 0;
  const progress = activeDuration > 0 ? (activeTime / activeDuration) * 100 : 0;

  return (
    <Card className={`rounded-none border-2 border-[#6d4918] bg-[#141414] p-6 text-white shadow-none ${className}`}>
      <CardContent className="p-0">
        <div className="flex flex-col items-center gap-6 md:flex-row">
          <div className="flex h-36 w-full shrink-0 items-center justify-center border border-[#6b481b] bg-[#231d16] md:w-36">
            <div className="flex h-20 items-center gap-1" aria-hidden="true">
              {[30, 52, 78, 42, 90, 64, 34, 70, 48, 84, 36, 58, 76, 44, 68].map((height, index) => (
                <span key={index} className={`w-1 bg-[#ff8a00] ${isActive && playing ? "animate-pulse" : ""}`} style={{ height: `${height}%`, animationDelay: `${index * 35}ms` }} />
              ))}
            </div>
          </div>

          <div className="w-full min-w-0">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#ff8a00]">Example of my work</p>
                <h3 className="mt-1 text-xl font-black">{track.title}</h3>
                <p className="mt-1 text-sm text-white/60">{track.description}</p>
              </div>
              <div className="flex items-center gap-1 sm:pt-1">
                <Button type="button" variant="ghost" size="icon" aria-label="Skip back 10 seconds" onClick={() => skip(-10)} disabled={!isActive} className="text-white/70 hover:bg-white/10 hover:text-white">
                  <SkipBack className="h-5 w-5" />
                </Button>
                <Button type="button" size="icon" aria-label={isActive && playing ? "Pause example" : "Play example"} onClick={() => togglePlayPause(track.audioUrl, track.title)} className="h-11 w-11 rounded-full bg-[#ff8a00] text-black hover:bg-[#ffac3d]">
                  {isActive && playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                <Button type="button" variant="ghost" size="icon" aria-label="Skip forward 10 seconds" onClick={() => skip(10)} disabled={!isActive} className="text-white/70 hover:bg-white/10 hover:text-white">
                  <SkipForward className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <input aria-label={`${track.title} progress`} type="range" min="0" max="100" step="0.1" value={progress} onChange={(event) => seek((Number(event.target.value) / 100) * activeDuration)} disabled={!isActive || activeDuration <= 0} className="mt-6 w-full accent-[#ff8a00]" />
            <div className="flex items-center justify-between text-xs text-white/55">
              <span>{formatTime(activeTime)}</span>
              <div className="flex items-center gap-2">
                <button type="button" aria-label={muted ? "Unmute example" : "Mute example"} onClick={toggleMute} className="text-[#ffb84d] hover:text-white">
                  {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <input aria-label="Example volume" type="range" min="0" max="1" step="0.01" value={muted ? 0 : volume} onChange={(event) => setVolume(Number(event.target.value))} className="w-20 accent-[#ff8a00]" />
                <span>{formatTime(activeDuration)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
