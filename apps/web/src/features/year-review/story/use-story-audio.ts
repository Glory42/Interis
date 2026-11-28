import { useCallback, useEffect, useRef, useState } from "react";
import type { StoryAct } from "./story-act";
import { createStoryAudioEngine, type StoryAudioEngine } from "./story-audio-engine";

export const STORY_SOUND_STORAGE_KEY = "interis:recap-sound";

const readMuted = () => {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORY_SOUND_STORAGE_KEY) === "off";
  } catch {
    return false;
  }
};

const persistMuted = (muted: boolean) => {
  try {
    window.localStorage.setItem(STORY_SOUND_STORAGE_KEY, muted ? "off" : "on");
  } catch {
    // Private mode or storage disabled; the in-memory state still works.
  }
};

export const useStoryAudio = (act: StoryAct) => {
  const [isMuted, setIsMuted] = useState(readMuted);
  const mutedRef = useRef(isMuted);
  const actRef = useRef(act);
  const engineRef = useRef<StoryAudioEngine | null>(null);

  const ensureEngine = useCallback(() => {
    engineRef.current ??= createStoryAudioEngine();
    return engineRef.current;
  }, []);

  // Must be called from a user gesture (Begin, tap, key, progress jump).
  const start = useCallback(() => {
    if (mutedRef.current) return;
    const engine = ensureEngine();
    if (!engine) return;
    engine.setMuted(false);
    engine.start(actRef.current);
  }, [ensureEngine]);

  const toggleMuted = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setIsMuted(next);
    persistMuted(next);
    engineRef.current?.setMuted(next);
  }, []);

  useEffect(() => {
    actRef.current = act;
    engineRef.current?.setAct(act);
  }, [act]);

  useEffect(() => {
    const onVisibility = () => {
      const engine = engineRef.current;
      if (!engine) return;
      if (document.visibilityState === "hidden") engine.suspend();
      else engine.resume();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(
    () => () => {
      engineRef.current?.stop();
      engineRef.current = null;
    },
    [],
  );

  return { isMuted, toggleMuted, start };
};
