import { truncateExcerpt } from "../../../commons/helpers/text.helper";

type SeriesInfo = {
  id: number;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  firstAirYear: number | null;
};

const toSeriesMediaFields = (series: SeriesInfo) => ({
  seriesId: series.id,
  tmdbId: series.tmdbId,
  title: series.title,
  posterPath: series.posterPath,
  releaseYear: series.firstAirYear,
  mediaType: "tv" as const,
});

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
  ...toSeriesMediaFields(input.series),
  rating: input.rating,
  rewatch: input.rewatch,
  hasReview: Boolean(input.review),
  reviewId: input.review?.id ?? null,
  containsSpoilers: input.review?.containsSpoilers ?? null,
  excerpt: input.review ? truncateExcerpt(input.review.content) : null,
});

export const buildSerialInteractionActivityMetadata = (input: {
  series: {
    id: number;
    tmdbId: number;
    title: string;
    posterPath: string | null;
    firstAirYear: number | null;
  };
}) => toSeriesMediaFields(input.series);

export const buildSeasonLikedActivityMetadata = (input: {
  series: SeriesInfo;
  seasonNumber: number;
}) => ({
  ...toSeriesMediaFields(input.series),
  seasonNumber: input.seasonNumber,
});

export const buildEpisodeLikedActivityMetadata = (input: {
  series: SeriesInfo;
  seasonNumber: number;
  episodeNumber: number;
}) => ({
  ...toSeriesMediaFields(input.series),
  seasonNumber: input.seasonNumber,
  episodeNumber: input.episodeNumber,
});

export const buildSeasonReviewActivityMetadata = (input: {
  series: SeriesInfo;
  seasonNumber: number;
  review: { id: string; content: string; containsSpoilers: boolean };
}) => ({
  ...toSeriesMediaFields(input.series),
  seasonNumber: input.seasonNumber,
  reviewId: input.review.id,
  excerpt: truncateExcerpt(input.review.content),
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
  ...toSeriesMediaFields(input.series),
  seasonNumber: input.seasonNumber,
  rating: input.rating,
});

export const buildEpisodeRatingActivityMetadata = (input: {
  series: SeriesInfo;
  seasonNumber: number;
  episodeNumber: number;
  rating: number;
}) => ({
  ...toSeriesMediaFields(input.series),
  seasonNumber: input.seasonNumber,
  episodeNumber: input.episodeNumber,
  rating: input.rating,
});
