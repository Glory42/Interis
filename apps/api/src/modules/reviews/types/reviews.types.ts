import type { MediaType } from "../../media/constants/media-type.constant";

// The movie/tv-only view of a review's media, used by activity-feed and
// notification metadata (which never carry season/episode reviews). For the
// full set the `review.mediaType` column can store, see `ReviewRowMediaType`
// in ../constants/review-media-type.constant.ts.
export type ReviewMediaType = MediaType;

export type ReviewMediaMetadata = {
  mediaType: ReviewMediaType;
  tmdbId: number | null;
  title: string | null;
  posterPath: string | null;
  releaseYear: number | null;
};
