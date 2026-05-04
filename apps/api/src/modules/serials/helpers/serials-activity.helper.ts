import { DIARY_REVIEW_EXCERPT_LENGTH } from "../../diary/constants/diary.constants";

export const buildSerialDiaryEntryActivityMetadata = (input: {
  series: {
    id: number;
    tmdbId: number;
    title: string;
    posterPath: string | null;
    firstAirYear: number | null;
  };
  rating: number | null;
  rewatch: boolean;
  review:
    | {
        id: string;
        content: string;
        containsSpoilers: boolean;
      }
    | null;
}) => ({
  seriesId: input.series.id,
  tmdbId: input.series.tmdbId,
  title: input.series.title,
  posterPath: input.series.posterPath,
  releaseYear: input.series.firstAirYear,
  rating: input.rating,
  rewatch: input.rewatch,
  mediaType: "tv",
  hasReview: Boolean(input.review),
  reviewId: input.review?.id ?? null,
  containsSpoilers: input.review?.containsSpoilers ?? null,
  excerpt: input.review?.content.slice(0, DIARY_REVIEW_EXCERPT_LENGTH) ?? null,
});

export const buildSerialInteractionActivityMetadata = (input: {
  series: {
    id: number;
    tmdbId: number;
    title: string;
    posterPath: string | null;
    firstAirYear: number | null;
  };
}) => ({
  seriesId: input.series.id,
  tmdbId: input.series.tmdbId,
  title: input.series.title,
  posterPath: input.series.posterPath,
  releaseYear: input.series.firstAirYear,
  mediaType: "tv",
});
