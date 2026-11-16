import { DIARY_TAG_MAX_LENGTH } from "@/types/api";

// Mirrors the API's rule: letters (with their marks) and digits in any script, plus space, - _ and '.
const TAG_PATTERN = /^[\p{L}\p{N}][\p{L}\p{M}\p{N} _'-]*$/u;

// "  With   Mom " → "with mom"; null when the tag would be rejected.
export const normalizeDiaryTag = (raw: string): string | null => {
  const tag = raw.trim().replace(/^#+/, "").toLowerCase().normalize("NFC").replace(/\s+/g, " ").trim();
  if (!tag || tag.length > DIARY_TAG_MAX_LENGTH || !TAG_PATTERN.test(tag)) return null;
  return tag;
};
