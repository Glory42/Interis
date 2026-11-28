import { memo } from "react";
import { Pause, Play, Volume2, VolumeX, X } from "lucide-react";

type StoryControlsProps = {
  year: number;
  isPaused: boolean;
  isMuted: boolean;
  onPause: () => void;
  onToggleMute: () => void;
  onExit: () => void;
};

export const StoryControls = memo(
  ({ year, isPaused, isMuted, onPause, onToggleMute, onExit }: StoryControlsProps) => (
    <div className="recap-controls">
      <span className="recap-brand">Recap · {year}</span>
      <div className="recap-control-actions">
        <button
          type="button"
          className="recap-icon-btn"
          aria-label={isMuted ? "Unmute the recap music" : "Mute the recap music"}
          data-story-control
          onClick={onToggleMute}
        >
          {isMuted ? (
            <VolumeX aria-hidden className="size-3" />
          ) : (
            <Volume2 aria-hidden className="size-3" />
          )}
        </button>
        <button
          type="button"
          className="recap-icon-btn"
          aria-label={isPaused ? "Play" : "Pause"}
          data-story-control
          onClick={onPause}
        >
          {isPaused ? (
            <Play aria-hidden className="size-3" />
          ) : (
            <Pause aria-hidden className="size-3" />
          )}
        </button>
        <button
          type="button"
          className="recap-icon-btn"
          aria-label="Exit the recap"
          data-story-control
          onClick={onExit}
        >
          <X aria-hidden className="size-3" />
        </button>
      </div>
    </div>
  ),
);

StoryControls.displayName = "StoryControls";
