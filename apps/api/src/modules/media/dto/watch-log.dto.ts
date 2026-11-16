import { z } from "zod";
import {
  DIARY_NOTE_MAX_LENGTH,
  DIARY_TAG_MAX_LENGTH,
  DIARY_TAGS_MAX_PER_ENTRY,
} from "../constants/diary-entry.constants";
import { normalizeDiaryTags } from "../helpers/diary-tag.helper";

// One length for a Review wherever it's written: alone, with a new log or by a log edit.
export const REVIEW_MAX_LENGTH = 10000;

// Log edit fields for the attached Review, shared by the Film and Series log
// update DTOs. Text creates or rewrites it, null or blank deletes it.
export const watchLogReviewEditShape = {
  review: z.string().max(REVIEW_MAX_LENGTH).nullable().optional(),
  containsSpoilers: z.boolean().optional(),
};

// Normalized and deduped; a tag that can't be normalized is a 400, not silently dropped.
const diaryTagsSchema = z
  .array(z.string().max(DIARY_TAG_MAX_LENGTH * 2))
  .max(DIARY_TAGS_MAX_PER_ENTRY * 2)
  .transform((raw, ctx) => {
    const { tags, invalid } = normalizeDiaryTags(raw);
    if (invalid.length > 0) {
      ctx.addIssue({
        code: "custom",
        message: `Invalid tag "${invalid[0]}": up to ${DIARY_TAG_MAX_LENGTH} letters, numbers, spaces, - _ or '`,
      });
      return z.NEVER;
    }
    if (tags.length > DIARY_TAGS_MAX_PER_ENTRY) {
      ctx.addIssue({ code: "custom", message: `At most ${DIARY_TAGS_MAX_PER_ENTRY} tags per log` });
      return z.NEVER;
    }
    return tags;
  });

const diaryNoteSchema = z.string().max(DIARY_NOTE_MAX_LENGTH);

// The private note and tags of a new log, shared by the Film and Series create DTOs.
export const watchLogExtrasCreateShape = {
  note: diaryNoteSchema.optional(),
  tags: diaryTagsSchema.optional(),
};

// On edit: null or blank clears the note; tags replace the whole set.
export const watchLogExtrasEditShape = {
  note: diaryNoteSchema.nullable().optional(),
  tags: diaryTagsSchema.optional(),
};
