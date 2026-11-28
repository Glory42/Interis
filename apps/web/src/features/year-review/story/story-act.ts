import type { StorySlideKind } from "./story.types";

// One chord per beat of the story. Neighbouring cards share an act, so the
// soundtrack moves when the deck changes subject, not on every tap.
export type StoryAct = "open" | "volume" | "titles" | "one" | "texture" | "verdict" | "end";

const ACTS: Record<StorySlideKind, StoryAct> = {
  cover: "open",
  empty: "open",
  volume: "volume",
  "ranked-titles": "titles",
  spotlight: "one",
  genre: "texture",
  director: "texture",
  "time-machine": "texture",
  rhythm: "texture",
  taste: "texture",
  words: "texture",
  persona: "verdict",
  end: "end",
};

export const storyActFor = (kind: StorySlideKind): StoryAct => ACTS[kind];
