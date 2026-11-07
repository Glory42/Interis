import { z } from "zod";

// Log edit fields for the attached Review, shared by the Film and Series log
// update DTOs. Text creates or rewrites it, null or blank deletes it.
export const watchLogReviewEditShape = {
  review: z.string().max(10000).nullable().optional(),
  containsSpoilers: z.boolean().optional(),
};
