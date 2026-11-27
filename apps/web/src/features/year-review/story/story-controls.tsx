import { memo } from "react";
import { Pause, Play, X } from "lucide-react";

type StoryControlsProps = {
  year: number;
  isPaused: boolean;
  onPause: () => void;
  onExit: () => void;
};

export const StoryControls = memo(({ year, isPaused, onPause, onExit }: StoryControlsProps) => (
  <div className="recap-controls">
    <span className="recap-brand">Recap · {year}</span>
    <div className="recap-control-actions">
      <button
        type="button"
        className="recap-icon-btn"
        aria-label={isPaused ? "Play" : "Pause"}
        data-story-control
        onClick={onPause}
      >
        {isPaused ? <Play aria-hidden className="size-3" /> : <Pause aria-hidden className="size-3" />}
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
));

StoryControls.displayName = "StoryControls";
