import { DIARY_REVIEW_EXCERPT_LENGTH } from "../../diary/constants/diary.constants";

type SeriesInfo = {
  id: number;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  firstAirYear: number | null;
};

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

export const buildSeasonLikedActivityMetadata = (input: {
  series: SeriesInfo;
  seasonNumber: number;
}) => ({
  seriesId: input.series.id,
  tmdbId: input.series.tmdbId,
  title: input.series.title,
  posterPath: input.series.posterPath,
  releaseYear: input.series.firstAirYear,
  mediaType: "tv",
  seasonNumber: input.seasonNumber,
});

export const buildEpisodeLikedActivityMetadata = (input: {
  series: SeriesInfo;
  seasonNumber: number;
  episodeNumber: number;
}) => ({
  seriesId: input.series.id,
  tmdbId: input.series.tmdbId,
  title: input.series.title,
  posterPath: input.series.posterPath,
  releaseYear: input.series.firstAirYear,
  mediaType: "tv",
  seasonNumber: input.seasonNumber,
  episodeNumber: input.episodeNumber,
});

export const buildSeasonReviewActivityMetadata = (input: {
  series: SeriesInfo;
  seasonNumber: number;
  review: { id: string; content: string; containsSpoilers: boolean };
}) => ({
  seriesId: input.series.id,
  tmdbId: input.series.tmdbId,
  title: input.series.title,
  posterPath: input.series.posterPath,
  releaseYear: input.series.firstAirYear,
  mediaType: "tv",
  seasonNumber: input.seasonNumber,
  reviewId: input.review.id,
  excerpt: input.review.content.slice(0, DIARY_REVIEW_EXCERPT_LENGTH),
  containsSpoilers: input.review.containsSpoilers,
});

export const buildEpisodeReviewActivityMetadata = (input: {
  series: SeriesInfo;
  seasonNumber: number;
  episodeNumber: number;
  review: { id: string; content: string; containsSpoilers: boolean };
}) => ({
  ...buildSeasonReviewActivityMetadata({
    series: input.series,
    seasonNumber: input.seasonNumber,
    review: input.review,
  }),
  episodeNumber: input.episodeNumber,
});

export const buildSeasonRatingActivityMetadata = (input: {
  series: SeriesInfo;
  seasonNumber: number;
  rating: number;
}) => ({
  seriesId: input.series.id,
  tmdbId: input.series.tmdbId,
  title: input.series.title,
  posterPath: input.series.posterPath,
  releaseYear: input.series.firstAirYear,
  mediaType: "tv",
  seasonNumber: input.seasonNumber,
  rating: input.rating,
});

export const buildEpisodeRatingActivityMetadata = (input: {
  series: SeriesInfo;
  seasonNumber: number;
  episodeNumber: number;
  rating: number;
}) => ({
  seriesId: input.series.id,
  tmdbId: input.series.tmdbId,
  title: input.series.title,
  posterPath: input.series.posterPath,
  releaseYear: input.series.firstAirYear,
  mediaType: "tv",
  seasonNumber: input.seasonNumber,
  episodeNumber: input.episodeNumber,
  rating: input.rating,
});
