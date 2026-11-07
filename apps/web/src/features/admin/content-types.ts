export const CONTENT_TYPES = [
  { value: "reviews", word: "reviews", label: "Reviews" },
  { value: "diary", word: "diary entries", label: "Diary entries" },
  { value: "posts", word: "posts", label: "Posts" },
  { value: "lists", word: "lists", label: "Lists" },
  { value: "activities", word: "activity", label: "Activity" },
  { value: "movies", word: "cached films", label: "Cached films" },
  { value: "serials", word: "cached series", label: "Cached series" },
] as const;

export type ContentType = (typeof CONTENT_TYPES)[number]["value"];

export const parseContentType = (value: unknown): ContentType =>
  CONTENT_TYPES.find((option) => option.value === value)?.value ?? "reviews";
