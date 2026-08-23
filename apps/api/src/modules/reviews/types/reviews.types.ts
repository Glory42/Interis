import type { MediaType } from "../../media/constants/media-type.constant";

export type ReviewMediaType = MediaType;

export type ReviewMediaMetadata = {
  mediaType: ReviewMediaType;
  tmdbId: number | null;
  title: string | null;
  posterPath: string | null;
  releaseYear: number | null;
};
