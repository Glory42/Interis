import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { storyActFor } from "../../../../../src/features/year-review/story/story-act";
import {
  STORY_SOUND_STORAGE_KEY,
  useStoryAudio,
} from "../../../../../src/features/year-review/story/use-story-audio";

class FakeParam {
  value = 0;
  cancelScheduledValues = vi.fn();
  setValueAtTime = vi.fn();
  linearRampToValueAtTime = vi.fn();
}

class FakeNode {
  connect = vi.fn(() => this);
}

class FakeGain extends FakeNode {
  gain = new FakeParam();
}

class FakeFilter extends FakeGain {
  type = "lowpass";
  frequency = new FakeParam();
  Q = new FakeParam();
}

class FakeOscillator extends FakeNode {
  type = "sine";
  frequency = new FakeParam();
  detune = new FakeParam();
  start = vi.fn();
  stop = vi.fn();
}

class FakeAudioContext {
  state = "running";
  currentTime = 0;
  destination = new FakeNode();
  oscillators: FakeOscillator[] = [];

  createGain = () => new FakeGain();
  createBiquadFilter = () => new FakeFilter();
  createOscillator = () => {
    const oscillator = new FakeOscillator();
    this.oscillators.push(oscillator);
    return oscillator;
  };
  resume = vi.fn(async () => undefined);
  suspend = vi.fn(async () => undefined);
  close = vi.fn(async () => undefined);
}

const audioContextKey = "AudioContext" as const;

describe("recap story audio", () => {
  const originalAudioContext = window[audioContextKey];

  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    window[audioContextKey] = originalAudioContext;
    window.localStorage.clear();
  });

  it("maps cards to a small set of acts", () => {
    expect(storyActFor("cover")).toBe("open");
    expect(storyActFor("volume")).toBe("volume");
    expect(storyActFor("ranked-titles")).toBe("titles");
    expect(storyActFor("spotlight")).toBe("one");
    expect(storyActFor("genre")).toBe("texture");
    expect(storyActFor("persona")).toBe("verdict");
    expect(storyActFor("end")).toBe("end");
  });

  it("defaults to sound on and persists the mute choice", () => {
    const { result } = renderHook(() => useStoryAudio("open"));
    expect(result.current.isMuted).toBe(false);

    act(() => result.current.toggleMuted());
    expect(result.current.isMuted).toBe(true);
    expect(window.localStorage.getItem(STORY_SOUND_STORAGE_KEY)).toBe("off");

    act(() => result.current.toggleMuted());
    expect(result.current.isMuted).toBe(false);
    expect(window.localStorage.getItem(STORY_SOUND_STORAGE_KEY)).toBe("on");
  });

  it("does nothing when Web Audio is unavailable", () => {
    window[audioContextKey] = undefined as unknown as typeof AudioContext;
    const { result, unmount } = renderHook(() => useStoryAudio("open"));

    expect(() => act(() => result.current.start())).not.toThrow();
    expect(() => act(() => result.current.toggleMuted())).not.toThrow();
    expect(() => unmount()).not.toThrow();
  });

  it("starts a three-note pad and crossfades to the next act", () => {
    vi.useFakeTimers();
    const instances: FakeAudioContext[] = [];
    class TrackingAudioContext extends FakeAudioContext {
      constructor() {
        super();
        instances.push(this);
      }
    }
    window[audioContextKey] = TrackingAudioContext as unknown as typeof AudioContext;

    const { result, rerender, unmount } = renderHook(
      ({ act }: { act: Parameters<typeof useStoryAudio>[0] }) => useStoryAudio(act),
      { initialProps: { act: "open" as const } },
    );

    act(() => result.current.start());
    expect(instances).toHaveLength(1);
    expect(instances[0]!.oscillators).toHaveLength(3);
    expect(instances[0]!.resume).toHaveBeenCalled();

    act(() => rerender({ act: "volume" }));
    expect(instances[0]!.oscillators).toHaveLength(6);

    act(() => result.current.toggleMuted());
    act(() => unmount());
    act(() => vi.advanceTimersByTime(600));
    expect(instances[0]!.close).toHaveBeenCalled();
  });
});
