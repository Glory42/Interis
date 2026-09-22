import {
  getSeriesAggregateCredits,
  getSeriesDetails,
  getSimilarSeries,
} from "../../../infrastructure/tmdb/serials";

// Mirrors movies-detail-tmdb-client.ts's seam for SerialsDetailService.gather().
export type SerialsDetailTmdbClient = {
  getDetails: typeof getSeriesDetails;
  getAggregateCredits: typeof getSeriesAggregateCredits;
  getSimilar: typeof getSimilarSeries;
};

export const defaultSerialsDetailTmdbClient: SerialsDetailTmdbClient = {
  getDetails: getSeriesDetails,
  getAggregateCredits: getSeriesAggregateCredits,
  getSimilar: getSimilarSeries,
};
