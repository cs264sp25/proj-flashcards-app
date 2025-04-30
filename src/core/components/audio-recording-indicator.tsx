import { useEffect, useState } from "react";
import { cn } from "@/core/lib/utils";

interface AudioRecordingIndicatorProps {
  isRecording: boolean;
}

export const AudioRecordingIndicator: React.FC<
  AudioRecordingIndicatorProps
> = ({ isRecording }) => {
  const [duration, setDuration] = useState(0);
  const [bars] = useState(Array.from({ length: 20 }, (_, i) => i)); // 20 bars

  // Handle recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Format duration to MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isRecording) return null;

  return (
    <div
      className={cn(
        // "absolute left-14 bottom-3",
        "flex items-center gap-3",
        "animate-fade-in",
      )}
    >
      {/* Recording indicator dot */}
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-sm text-red-500 font-medium">
          {formatDuration(duration)}
        </span>
      </div>

      {/* Animated bars */}
      <div className="flex items-center gap-[2px]">
        {bars.map((i) => (
          <div
            key={i}
            className={cn("w-[2px] bg-red-500/80", "animate-sound-wave")}
            style={{
              height: `${Math.random() * 20 + 5}px`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};
