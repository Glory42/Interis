import type { StoryAct } from "./story-act";

type Voice = {
  gain: GainNode;
  oscillators: OscillatorNode[];
};

export type StoryAudioEngine = {
  start: (act: StoryAct) => void;
  setAct: (act: StoryAct) => void;
  setMuted: (muted: boolean) => void;
  suspend: () => void;
  resume: () => void;
  stop: () => void;
};

// Three-note pads, one chord per act. Low, warm frequencies so the bed sits
// under the reading rather than competing with it.
const CHORDS: Record<StoryAct, readonly [number, number, number]> = {
  open: [130.81, 155.56, 196.0], // C3 · Eb3 · G3
  volume: [174.61, 220.0, 261.63], // F3 · A3 · C4
  titles: [146.83, 174.61, 220.0], // D3 · F3 · A3
  one: [196.0, 233.08, 293.66], // G3 · Bb3 · D4
  texture: [220.0, 261.63, 329.63], // A3 · C4 · E4
  verdict: [207.65, 261.63, 311.13], // Ab3 · C4 · Eb4
  end: [130.81, 164.81, 196.0], // C3 · E3 · G3
};

const MASTER_VOLUME = 0.055;
const ATTACK_SECONDS = 2.2;
const CROSSFADE_SECONDS = 2.8;
const MUTE_SECONDS = 0.35;
const FILTER_HZ = 760;

type AudioContextCtor = new () => AudioContext;

const audioContextCtor = (): AudioContextCtor | null => {
  if (typeof window === "undefined") return null;
  const candidate =
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
  return candidate ?? null;
};

export const createStoryAudioEngine = (): StoryAudioEngine | null => {
  const Ctor = audioContextCtor();
  if (!Ctor) return null;

  let context: AudioContext;
  try {
    context = new Ctor();
  } catch {
    return null;
  }

  const master = context.createGain();
  master.gain.value = 0;
  master.connect(context.destination);

  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = FILTER_HZ;
  filter.Q.value = 0.6;
  filter.connect(master);

  const rampTo = (param: AudioParam, value: number, seconds: number) => {
    const now = context.currentTime;
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(value, now + seconds);
  };

  const timers = new Set<ReturnType<typeof setTimeout>>();
  let started = false;
  let stopped = false;
  let muted = false;
  let playingAct: StoryAct | null = null;
  let active: Voice | null = null;

  const stopVoice = (voice: Voice) => {
    for (const oscillator of voice.oscillators) {
      try {
        oscillator.stop();
      } catch {
        // Already stopped.
      }
    }
  };

  const schedule = (fn: () => void, ms: number) => {
    const timer = setTimeout(() => {
      timers.delete(timer);
      fn();
    }, ms);
    timers.add(timer);
    return timer;
  };

  const makeVoice = (act: StoryAct): Voice => {
    const gain = context.createGain();
    gain.gain.value = 0;
    gain.connect(filter);

    const oscillators = CHORDS[act].map((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = index === 0 ? "sine" : "triangle";
      oscillator.frequency.value = frequency;
      oscillator.detune.value = index === 1 ? 4 : index === 2 ? -4 : 0;

      const voiceGain = context.createGain();
      voiceGain.gain.value = index === 0 ? 0.5 : 0.25;
      oscillator.connect(voiceGain).connect(gain);
      oscillator.start();
      return oscillator;
    });

    return { gain, oscillators };
  };

  const play = (act: StoryAct) => {
    if (stopped) return;
    const now = context.currentTime;
    const next = makeVoice(act);
    next.gain.gain.setValueAtTime(0, now);
    next.gain.gain.linearRampToValueAtTime(1, now + CROSSFADE_SECONDS);

    if (active) {
      rampTo(active.gain.gain, 0, CROSSFADE_SECONDS);
      const previous = active;
      schedule(() => stopVoice(previous), CROSSFADE_SECONDS * 1000 + 200);
    }

    active = next;
    playingAct = act;
  };

  return {
    start: (act) => {
      if (stopped) return;
      void context.resume().catch(() => undefined);
      if (started) {
        if (playingAct !== act) play(act);
        return;
      }
      started = true;
      rampTo(master.gain, muted ? 0 : MASTER_VOLUME, ATTACK_SECONDS);
      play(act);
    },

    setAct: (act) => {
      if (stopped || !started || playingAct === act) return;
      play(act);
    },

    setMuted: (nextMuted) => {
      muted = nextMuted;
      if (stopped || !started) return;
      rampTo(master.gain, muted ? 0 : MASTER_VOLUME, MUTE_SECONDS);
    },

    suspend: () => {
      if (stopped || context.state !== "running") return;
      void context.suspend().catch(() => undefined);
    },

    resume: () => {
      if (stopped) return;
      void context.resume().catch(() => undefined);
    },

    stop: () => {
      if (stopped) return;
      stopped = true;
      for (const timer of timers) clearTimeout(timer);
      timers.clear();
      rampTo(master.gain, 0, MUTE_SECONDS);
      const finalVoice = active;
      active = null;
      schedule(() => {
        if (finalVoice) stopVoice(finalVoice);
        void context.close().catch(() => undefined);
      }, MUTE_SECONDS * 1000 + 100);
    },
  };
};
