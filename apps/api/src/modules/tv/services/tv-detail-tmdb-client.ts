import {
  getSeriesAggregateCredits,
  getSeriesDetails,
  getSimilarSeries,
} from "../../../infrastructure/tmdb/tv";

// Mirrors movies-detail-tmdb-client.ts's seam for SerialsDetailService.gather().
export type TvDetailTmdbClient = {
  getDetails: typeof getSeriesDetails;
  getAggregateCredits: typeof getSeriesAggregateCredits;
  getSimilar: typeof getSimilarSeries;
};

export const defaultTvDetailTmdbClient: TvDetailTmdbClient = {
  getDetails: getSeriesDetails,
  getAggregateCredits: getSeriesAggregateCredits,
  getSimilar: getSimilarSeries,
};
