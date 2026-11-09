import type { ScopedTarget } from "./types";

export const MIN_QUERY_LENGTH = 2;
export const MAX_RESULTS_PER_SECTION = 6;

export const SECTION_LABEL: Record<ScopedTarget, string> = {
  movie: "Films",
  serials: "TV",
  users: "Members",
};

// Words for the scope sentence ("in everything ▾"); ⌘1–3 pick films, TV, members.
export const scopeOptions = [
  { value: "everything", word: "everything", label: "Everything" },
  { value: "movie", word: "films", label: "Films", hint: "⌘1" },
  { value: "serials", word: "TV", label: "TV", hint: "⌘2" },
  { value: "users", word: "members", label: "Members", hint: "⌘3" },
] as const;

export type SearchScope = (typeof scopeOptions)[number]["value"];
