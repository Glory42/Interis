import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { StorySlide } from "./story.types";

export const STORY_ADVANCE_MS = 8000;
const TICK_MS = 100;

export const usePrefersReducedMotion = (): boolean => {
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return reduced;
};

type UseStoryPlayerOptions = {
  slides: StorySlide[];
  initialSlideId?: string;
  reducedMotion?: boolean;
  paused?: boolean;
  onSlideChange?: (slide: StorySlide) => void;
};

export type StoryPlayerState = {
  index: number;
  current: StorySlide;
  progress: number;
  isPlaying: boolean;
  isPaused: boolean;
  begin: () => void;
  next: () => void;
  previous: () => void;
  goTo: (index: number) => void;
  togglePause: () => void;
};

export const useStoryPlayer = ({
  slides,
  initialSlideId,
  reducedMotion = false,
  paused = false,
  onSlideChange,
}: UseStoryPlayerOptions): StoryPlayerState => {
  const lastIndex = Math.max(0, slides.length - 1);
  const initialIndex = useMemo(() => {
    const found = slides.findIndex((slide) => slide.id === initialSlideId);
    return found >= 0 ? found : 0;
  }, [initialSlideId, slides]);
  const [index, setIndex] = useState(initialIndex);
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef(0);
  const [manualPause, setManualPause] = useState(false);
  const [hidden, setHidden] = useState(() => typeof document !== "undefined" && document.hidden);

  const current = slides[index] ?? slides[0]!;
  const isPlaying = !reducedMotion && index > 0 && index < lastIndex;
  const isPaused = manualPause || hidden || paused;
  const progress = index === 0 || index === lastIndex ? 1 : Math.min(1, elapsed / STORY_ADVANCE_MS);

  const goTo = useCallback(
    (nextIndex: number, options: { user?: boolean } = {}) => {
      const clamped = Math.max(0, Math.min(lastIndex, nextIndex));
      setIndex(clamped);
      elapsedRef.current = 0;
      setElapsed(0);
      if (options.user) setManualPause(false);
    },
    [lastIndex],
  );

  const begin = useCallback(() => goTo(1, { user: true }), [goTo]);
  const next = useCallback(() => goTo(index + 1, { user: true }), [goTo, index]);
  const previous = useCallback(() => goTo(index - 1, { user: true }), [goTo, index]);
  const togglePause = useCallback(() => {
    if (index === 0) {
      begin();
      return;
    }
    if (index === lastIndex) {
      goTo(0, { user: true });
      return;
    }
    setManualPause((value) => (paused ? false : !value));
  }, [begin, goTo, index, lastIndex, paused]);

  const onSlideChangeRef = useRef(onSlideChange);
  useEffect(() => {
    onSlideChangeRef.current = onSlideChange;
  }, [onSlideChange]);

  useEffect(() => {
    onSlideChangeRef.current?.(current);
  }, [current]);

  useEffect(() => {
    if (!isPlaying || isPaused) return;
    const timer = window.setInterval(() => {
      elapsedRef.current += TICK_MS;
      if (elapsedRef.current >= STORY_ADVANCE_MS) {
        goTo(index + 1);
        return;
      }
      setElapsed(elapsedRef.current);
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [goTo, index, isPlaying, isPaused]);

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return {
    index,
    current,
    progress,
    isPlaying,
    isPaused,
    begin,
    next,
    previous,
    goTo: (nextIndex: number) => goTo(nextIndex, { user: true }),
    togglePause,
  };
};
