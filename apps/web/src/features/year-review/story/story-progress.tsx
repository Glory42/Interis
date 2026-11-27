import { memo } from "react";
import type { StorySlide } from "./story.types";

type StoryProgressProps = {
  slides: StorySlide[];
  index: number;
  progress: number;
  onJump: (index: number) => void;
};

export const StoryProgress = memo(({ slides, index, progress, onJump }: StoryProgressProps) => (
  <div className="recap-progress" role="tablist" aria-label="Recap cards">
    {slides.map((slide, i) => (
      <button
        key={slide.id}
        type="button"
        role="tab"
        aria-selected={i === index}
        aria-label={`Go to card ${i + 1}: ${slide.label}`}
        className="recap-seg"
        data-story-control
        onClick={() => onJump(i)}
      >
        <i style={{ width: i < index ? "100%" : i === index ? `${progress * 100}%` : "0%" }} />
      </button>
    ))}
  </div>
));

StoryProgress.displayName = "StoryProgress";
