import { z } from "zod";
import {
  albumSchema,
  mbSearchResultSchema,
  musicArchiveItemSchema,
  musicArchiveResponseSchema,
  musicDetailResponseSchema,
  musicInteractionSchema,
  musicLogItemSchema,
  myMusicLogSchema,
  updateMusicLogInputSchema,
  createMusicLogInputSchema,
  updateMusicInteractionInputSchema,
  editionListItemSchema,
  editionsResponseSchema,
  editionTrackItemSchema,
  editionTracklistResponseSchema,
} from "./schemas";

export type Album = z.infer<typeof albumSchema>;
export type MbSearchResult = z.infer<typeof mbSearchResultSchema>;
export type MusicArchiveItem = z.infer<typeof musicArchiveItemSchema>;
export type MusicArchiveResponse = z.infer<typeof musicArchiveResponseSchema>;
export type MusicDetailResponse = z.infer<typeof musicDetailResponseSchema>;
export type MusicInteraction = z.infer<typeof musicInteractionSchema>;
export type MusicLogItem = z.infer<typeof musicLogItemSchema>;
export type MyMusicLog = z.infer<typeof myMusicLogSchema>;
export type UpdateMusicLogInput = z.infer<typeof updateMusicLogInputSchema>;
export type CreateMusicLogInput = z.infer<typeof createMusicLogInputSchema>;
export type UpdateMusicInteractionInput = z.infer<typeof updateMusicInteractionInputSchema>;
export type EditionListItem = z.infer<typeof editionListItemSchema>;
export type EditionsResponse = z.infer<typeof editionsResponseSchema>;
export type EditionTrackItem = z.infer<typeof editionTrackItemSchema>;
export type EditionTracklistResponse = z.infer<typeof editionTracklistResponseSchema>;

export type MusicArchiveSort =
  | "logs_desc"
  | "release_desc"
  | "release_asc"
  | "rating_desc"
  | "title_asc";

export type MusicDetailReviewSort = "popular" | "recent";

export type QueryRequestOptions = {
  signal?: AbortSignal;
};

export type MusicArchiveInput = {
  genre?: string;
  type?: string;
  sort?: MusicArchiveSort;
  page?: number;
  limit?: number;
};

export type MusicDetailInput = {
  reviewsSort?: MusicDetailReviewSort;
};
