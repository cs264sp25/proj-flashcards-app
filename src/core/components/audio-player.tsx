import { useEffect, useRef, useState } from "react";
import { Button } from "@/core/components/button";
import { Pause, Play } from "lucide-react";

interface AudioPlayerProps {
  url: string;
  onEnded?: () => void;
  autoPlay?: boolean;
}

export function AudioPlayer({
  url,
  onEnded,
  autoPlay = false,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.load();
    }
  }, [url]);

  // Handle auto-play
  useEffect(() => {
    if (autoPlay && audioRef.current && !isLoading) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [autoPlay, isLoading]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <audio
        ref={audioRef}
        onLoadedData={() => setIsLoading(false)}
        onEnded={() => {
          setIsPlaying(false);
          onEnded?.();
        }}
      />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={togglePlay}
        disabled={isLoading}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
