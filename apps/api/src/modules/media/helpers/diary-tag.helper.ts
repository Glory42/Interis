import { DIARY_TAG_MAX_LENGTH, DIARY_TAGS_MAX_PER_ENTRY } from "../constants/diary-entry.constants";

// Letters (with their combining marks) and digits in any script, plus space, - _ and '.
const TAG_PATTERN = /^[\p{L}\p{N}][\p{L}\p{M}\p{N} _'-]*$/u;
const DISALLOWED_CHARS = /[^\p{L}\p{M}\p{N} _'-]+/gu;

// Trims, lowercases and collapses spaces ("  With   Mom " → "with mom"); a leading
// "#" is dropped. null when nothing usable is left or the result breaks the rules.
export const normalizeDiaryTag = (raw: string): string | null => {
  const tag = raw.trim().replace(/^#+/, "").toLowerCase().normalize("NFC").replace(/\s+/g, " ").trim();
  if (!tag || tag.length > DIARY_TAG_MAX_LENGTH || !TAG_PATTERN.test(tag)) return null;
  return tag;
};

// Normalized, deduped tags in input order, plus the raw values that were rejected.
export const normalizeDiaryTags = (raw: readonly string[]): { tags: string[]; invalid: string[] } => {
  const tags: string[] = [];
  const invalid: string[] = [];
  for (const value of raw) {
    const tag = normalizeDiaryTag(value);
    if (tag === null) invalid.push(value);
    else if (!tags.includes(tag)) tags.push(tag);
  }
  return { tags, invalid };
};

// Imports are lenient: odd characters become spaces, unusable tags are dropped, the rest capped.
export const sanitizeImportedDiaryTags = (raw: readonly string[]): string[] =>
  normalizeDiaryTags(raw.map((value) => value.replace(DISALLOWED_CHARS, " "))).tags.slice(
    0,
    DIARY_TAGS_MAX_PER_ENTRY,
  );

// A blank note is no note.
export const normalizeDiaryNote = (raw: string | null | undefined): string | null => {
  const note = raw?.trim() ?? "";
  return note.length > 0 ? note : null;
};
