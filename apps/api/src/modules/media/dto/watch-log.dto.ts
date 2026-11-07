import { z } from "zod";

// One length for a Review wherever it's written: alone, with a new log or by a log edit.
export const REVIEW_MAX_LENGTH = 10000;

// Log edit fields for the attached Review, shared by the Film and Series log
// update DTOs. Text creates or rewrites it, null or blank deletes it.
export const watchLogReviewEditShape = {
  review: z.string().max(REVIEW_MAX_LENGTH).nullable().optional(),
  containsSpoilers: z.boolean().optional(),
};
