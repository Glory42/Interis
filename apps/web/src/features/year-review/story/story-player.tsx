import { useEffect, useMemo, useRef } from "react";
import type { MouseEvent, PointerEvent, ReactNode } from "react";
import { StoryControls } from "./story-controls";
import { StoryProgress } from "./story-progress";
import { StorySlideFrame } from "./story-slide-frame";
import type { StoryActions, StorySlide } from "./story.types";
import { usePrefersReducedMotion, useStoryPlayer } from "./use-story-player";
import "./story.css";

type StoryPlayerProps = {
  slides: StorySlide[];
  year: number;
  initialSlideId?: string;
  reducedMotion?: boolean;
  onSlideChange?: (slide: StorySlide) => void;
  onExit: () => void;
  renderSlide: (slide: StorySlide, actions: StoryActions) => ReactNode;
};

export const StoryPlayer = ({
  slides,
  year,
  initialSlideId,
  reducedMotion,
  onSlideChange,
  onExit,
  renderSlide,
}: StoryPlayerProps) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const player = useStoryPlayer({
    slides,
    initialSlideId,
    reducedMotion: reducedMotion ?? prefersReducedMotion,
    onSlideChange,
  });
  const { index, current, progress, isPlaying, isPaused, begin, next, previous, goTo, togglePause } =
    player;
  const cardRef = useRef<HTMLDivElement>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  const actions = useMemo<StoryActions>(
    () => ({ begin, next, previous, togglePause, isPaused }),
    [begin, isPaused, next, previous, togglePause],
  );

  const content = useMemo(
    () => renderSlide(current, actions),
    [actions, current, renderSlide],
  );

  useEffect(() => {
    cardRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select")) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        next();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        previous();
      } else if (event.key === " ") {
        event.preventDefault();
        togglePause();
      } else if (event.key === "Escape") {
        event.preventDefault();
        onExit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, onExit, previous, togglePause]);

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target instanceof Element && event.target.closest("button, a, [data-story-control]")) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    if (x < rect.width * 0.3) previous();
    else next();
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.target instanceof Element && event.target.closest("button, a, [data-story-control]")) return;
    pointerStart.current = { x: event.clientX, y: event.clientY };
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next();
      else previous();
    }
  };

  return (
    <div className="recap-stage">
      <div
        className="recap-card"
        ref={cardRef}
        tabIndex={-1}
        role="region"
        aria-roledescription="carousel"
        aria-label="Year in review story"
        data-testid="story-stage"
      >
        <div className="recap-grain" aria-hidden />
        <StoryProgress slides={slides} index={index} progress={progress} onJump={goTo} />
        <StoryControls
          year={year}
          isPaused={isPaused || !isPlaying}
          onPause={togglePause}
          onExit={onExit}
        />
        <div
          className="recap-deck"
          data-testid="story-deck"
          onClick={handleClick}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          <StorySlideFrame key={current.id} slide={current}>
            {content}
          </StorySlideFrame>
        </div>
        <p className="recap-hint">Tap right to advance · tap left to go back</p>
        <p className="sr-only" aria-live="polite">
          Slide {index + 1} of {slides.length}: {current.label}
        </p>
      </div>
    </div>
  );
};
