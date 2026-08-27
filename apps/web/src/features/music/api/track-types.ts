import { z } from "zod";
import {
  trackSchema,
  trackDetailResponseSchema,
  trackInteractionSchema,
  myTrackLogSchema,
  updateTrackLogInputSchema,
  createTrackLogInputSchema,
  updateTrackInteractionInputSchema,
} from "./track-schemas";

export type Track = z.infer<typeof trackSchema>;
export type TrackDetailResponse = z.infer<typeof trackDetailResponseSchema>;
export type TrackInteraction = z.infer<typeof trackInteractionSchema>;
export type MyTrackLog = z.infer<typeof myTrackLogSchema>;
export type UpdateTrackLogInput = z.infer<typeof updateTrackLogInputSchema>;
export type CreateTrackLogInput = z.infer<typeof createTrackLogInputSchema>;
export type UpdateTrackInteractionInput = z.infer<typeof updateTrackInteractionInputSchema>;

export type TrackDetailReviewSort = "popular" | "recent";

export type TrackDetailInput = {
  reviewsSort?: TrackDetailReviewSort;
};
