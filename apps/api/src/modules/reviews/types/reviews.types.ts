import type { MediaType } from "../../media/constants/media-type.constant";

export type ReviewMediaType = MediaType;

export type ReviewMediaMetadata = {
  mediaType: ReviewMediaType;
  tmdbId?: number | null;
  mbid?: string | null;
  volumeId?: string | null;
  title: string | null;
  posterPath?: string | null;
  coverArtUrl?: string | null;
  artistName?: string | null;
  authors?: string[] | null;
  releaseYear: number | null;
};
