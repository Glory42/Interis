export type ReviewMediaType = "movie" | "tv" | "book" | "music";

export type ReviewMediaMetadata = {
  mediaType: ReviewMediaType;
  tmdbId: number | null;
  title: string | null;
  posterPath: string | null;
  releaseYear: number | null;
};
